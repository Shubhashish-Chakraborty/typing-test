"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

	const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		if (state === "idle") handleStart();
		const value = e.target.value;
		if (value.endsWith(" ")) {
			// word submitted
			const submitted = value.slice(0, -1);
			setTypedHistory((h) => [...h, submitted]);
			setWordIndex((i) => i + 1);
			setCurrentInput("");
			// keep buffer of words large enough
			setTargetWords((words) => {
				if (wordIndex + 50 > words.length) {
					return [...words, ...generateWordSequence(120)];
				}
				return words;
			});
		} else {
			setCurrentInput(value);
		}
	}, [state, handleStart, wordIndex]);

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
		<div className="mx-auto max-w-3xl px-4 py-10">
			<div className="text-center font-bold text-2xl mb-10">
				~ Developed by 
				<Link href={'https://bento.me/imshubh'} target="_blank">
					<span className="text-amber-300 hover:underline"> Shubhashish </span>
				</Link>
			</div>
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-semibold text-gray-100">Typing Test</h1>
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

			<div className="relative rounded-md border border-neutral-800 p-4 min-h-[160px] bg-neutral-900">
				<div className="flex flex-wrap gap-x-2 gap-y-3 text-lg leading-relaxed">
					{targetWords.slice(0, wordIndex).map((w, i) => (
						<span key={i} className={classNames("px-0.5", typedHistory[i] === w ? "text-green-400" : "text-red-400 line-through")}>{w}</span>
					))}
					<span className="relative">
						<span className="px-0.5 bg-yellow-400/30 rounded-sm text-gray-100">
							{targetWords[wordIndex]}
						</span>
					</span>
					{targetWords.slice(wordIndex + 1, wordIndex + 80).map((w, i) => (
						<span key={i} className="px-0.5 text-gray-400">{w}</span>
					))}
				</div>
			</div>

			<div className="mt-4">
				<input
					ref={inputRef}
					type="text"
					value={currentInput}
					onChange={handleChange}
					disabled={state === "finished"}
					className="w-full rounded-md border border-neutral-700 bg-neutral-900 text-gray-100 placeholder:text-gray-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white disabled:bg-neutral-900/60"
					placeholder={state === "idle" ? "Start typing to begin..." : state === "running" ? "Keep typing..." : "Finished. Press Restart to try again."}
				/>
			</div>
		</div>
	);
}


