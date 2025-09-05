"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { generateWordSequence } from "@/lib/words";
import Link from "next/link";

type TestDuration = 30 | 60;

type TestState = "idle" | "running" | "finished";

function useCountdown(seconds: number, isRunning: boolean, onDone: () => void) {
	const [timeLeft, setTimeLeft] = useState<number>(seconds);
	const savedOnDone = useRef(onDone);

	useEffect(() => {
		savedOnDone.current = onDone;
	}, [onDone]);

	useEffect(() => {
		setTimeLeft(seconds);
	}, [seconds]);

	useEffect(() => {
		if (!isRunning) return;
		if (timeLeft <= 0) {
			savedOnDone.current();
			return;
		}
		const id = setInterval(() => {
			setTimeLeft((t) => {
				if (t <= 1) {
					clearInterval(id);
					savedOnDone.current();
					return 0;
				}
				return t - 1;
			});
		}, 1000);
		return () => clearInterval(id);
	}, [isRunning, timeLeft]);

	return timeLeft;
}

function classNames(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(" ");
}

export default function TypingTest() {
	const [duration, setDuration] = useState<TestDuration>(30);
	const [state, setState] = useState<TestState>("idle");
	const [targetWords, setTargetWords] = useState<string[]>(() => generateWordSequence(180));
	const [currentInput, setCurrentInput] = useState<string>("");
	const [wordIndex, setWordIndex] = useState<number>(0);
	const [typedHistory, setTypedHistory] = useState<string[]>([]);
	const inputRef = useRef<HTMLInputElement | null>(null);

	const isRunning = state === "running";
	const timeLeft = useCountdown(duration, isRunning, () => setState("finished"));

	useEffect(() => {
		if (state === "idle") {
			setTargetWords(generateWordSequence(180));
			setCurrentInput("");
			setWordIndex(0);
			setTypedHistory([]);
		}
	}, [state]);

	useEffect(() => {
		if (state !== "finished") return;
		inputRef.current?.blur();
	}, [state]);

	const handleStart = useCallback(() => {
		setState("running");
		setCurrentInput("");
		setWordIndex(0);
		setTypedHistory([]);
		setTargetWords((prev) => (prev.length < 120 ? generateWordSequence(180) : prev));
		requestAnimationFrame(() => inputRef.current?.focus());
	}, []);

	const handleRestart = useCallback(() => {
		setState("idle");
	}, []);

	const submitWord = useCallback((submitted: string) => {
		setTypedHistory((h) => [...h, submitted]);
		setWordIndex((i) => i + 1);
		setCurrentInput("");
		setTargetWords((words) => {
			if (wordIndex + 50 > words.length) {
				return [...words, ...generateWordSequence(120)];
			}
			return words;
		});
	}, [wordIndex]);

	const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		if (state === "idle") handleStart();
		const value = e.target.value;
		if (value.endsWith(" ")) {
			const submitted = value.slice(0, -1);
			submitWord(submitted);
		} else {
			setCurrentInput(value);
		}
	}, [state, handleStart, submitWord]);

	// Global key handling to allow typing anywhere on the page
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (state === "finished") return;
			if (document.activeElement === inputRef.current) return;
			if (e.ctrlKey || e.metaKey || e.altKey) return;
			if (state === "idle") {
				if (e.key === " " || e.key === "Backspace" || e.key.length === 1) {
					handleStart();
				}
			}
			if (e.key === " ") {
				e.preventDefault();
				submitWord(currentInput);
				return;
			}
			if (e.key === "Backspace") {
				e.preventDefault();
				setCurrentInput((v) => v.slice(0, -1));
				return;
			}
			if (e.key.length === 1) {
				e.preventDefault();
				setCurrentInput((v) => v + e.key);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [state, handleStart, submitWord, currentInput]);

	const results = useMemo(() => {
		const totalTyped = typedHistory.length + (state === "finished" && currentInput ? 1 : 0);
		const correct = typedHistory.filter((w, idx) => w === targetWords[idx]).length + (state === "finished" && currentInput ? (currentInput === targetWords[wordIndex] ? 1 : 0) : 0);
		const incorrect = totalTyped - correct;
		const minutes = duration / 60;
		const wpm = Math.round((correct / minutes) || 0);
		const accuracy = totalTyped > 0 ? Math.round((correct / totalTyped) * 100) : 0;
		return { wpm, accuracy, correct, incorrect, totalTyped };
	}, [typedHistory, targetWords, duration, state, currentInput, wordIndex]);

	return (
		<div className="mx-auto max-w-4xl px-6 py-12">
			<div className="text-center font-bold text-2xl mb-10">
				~ Developed by {" "}
				<Link href={'https://imshubh.cc.cc'} target="_blank">
					<span className="text-amber-300 hover:underline">Shubhashish </span>
				</Link>

				<div className="text-xl mt-2 flex justify-center">
					<Link href={"https://github.com/Shubhashish-Chakraborty/breakyourkeyboard"} target="_blank">
						<svg fill="currentColor" stroke="currentColor" className="size-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512">
							<path d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3 .3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5 .3-6.2 2.3zm44.2-1.7c-2.9 .7-4.9 2.6-4.6 4.9 .3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3 .7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3 .3 2.9 2.3 3.9 1.6 1 3.6 .7 4.3-.7 .7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3 .7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3 .7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z" />
						</svg>
					</Link>
				</div>
			</div>

			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-semibold text-gray-100">Smash those Keys!!</h1>
				<div className="flex items-center gap-2">
					{([30, 60] as TestDuration[]).map((d) => (
						<button
							key={d}
							onClick={() => {
								setDuration(d);
								setState("idle");
							}}
							className={classNames(
								"px-3 py-1 rounded border transition-colors",
								duration === d ? "bg-white text-black border-white" : "border-neutral-700 text-gray-200 hover:bg-neutral-800"
							)}
						>
							{d}s
						</button>
					))}
					<button
						onClick={handleRestart}
						className="ml-2 px-3 py-1 rounded border border-neutral-700 text-gray-200 hover:bg-neutral-800"
					>
						Restart
					</button>
				</div>
			</div>

			<div className="flex items-center justify-between mb-4">
				<div className="text-gray-300">Time: <span className="font-semibold text-gray-100">{timeLeft}s</span></div>
				{state !== "finished" ? (
					<div className="text-gray-400">Type to start</div>
				) : (
					<div className="flex gap-4 text-sm text-gray-300">
						<div>WPM: <span className="font-semibold text-gray-100">{results.wpm}</span></div>
						<div>Accuracy: <span className="font-semibold text-gray-100">{results.accuracy}%</span></div>
						<div>Correct: <span className="font-semibold text-gray-100">{results.correct}</span></div>
						<div>Incorrect: <span className="font-semibold text-gray-100">{results.incorrect}</span></div>
					</div>
				)}
			</div>

			<div className="relative rounded-lg border border-blue-300 p-6 min-h-[240px] bg-neutral-900">
				<div className="flex flex-wrap gap-x-3 gap-y-4 text-2xl leading-loose">
					{targetWords.slice(0, wordIndex).map((w, i) => (
						<span key={i} className={classNames("px-0.5", typedHistory[i] === w ? "text-green-400" : "text-red-400 line-through")}>{w}</span>
					))}
					<span className="relative">
						<span className="px-0.5 rounded-sm text-gray-100">
							{(() => {
								const currentWord = targetWords[wordIndex] ?? "";
								const maxLen = Math.max(currentWord.length, currentInput.length);
								const letters: ReactNode[] = [];
								for (let i = 0; i < maxLen; i++) {
									const targetChar = currentWord[i] ?? "";
									const typedChar = currentInput[i];
									if (typedChar !== undefined) {
										const isCorrect = typedChar === targetChar;
										letters.push(
											<span key={i} className={isCorrect ? "text-green-400" : "text-red-400"}>{typedChar}</span>
										);
									} else {
										letters.push(
											<span key={i} className="text-gray-400">{targetChar}</span>
										);
									}
								}
								letters.splice(currentInput.length, 0, (
									<span key="caret" className="inline-block w-px h-7 align-middle bg-gray-200 animate-pulse mx-0.5" />
								));
								return letters;
							})()}
						</span>
					</span>
					{targetWords.slice(wordIndex + 1, wordIndex + 80).map((w, i) => (
						<span key={i} className="px-0.5 text-gray-400">{w}</span>
					))}
				</div>
			</div>

			{/* <div className="mt-4">
				<input
					ref={inputRef}
					type="text"
					value={currentInput}
					onChange={handleChange}
					disabled={state === "finished"}
					className="w-full rounded-md border border-neutral-700 bg-neutral-900 text-gray-100 placeholder:text-gray-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white disabled:bg-neutral-900/60"
					placeholder={state === "idle" ? "Start typing to begin..." : state === "running" ? "Keep typing..." : "Finished. Press Restart to try again."}
				/>
			</div> */}
		</div>
	);
}


