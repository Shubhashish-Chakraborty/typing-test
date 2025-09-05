const defaultWords = [
	"the","be","to","of","and","a","in","that","have","I",
	"it","for","not","on","with","he","as","you","do","at",
	"this","but","his","by","from","they","we","say","her","she",
	"or","an","will","my","one","all","would","there","their","what",
	"so","up","out","if","about","who","get","which","go","me",
	"when","make","can","like","time","no","just","him","know","take",
	"people","into","year","your","good","some","could","them","see","other",
	"than","then","now","look","only","come","its","over","think","also",
	"back","after","use","two","how","our","work","first","well","way",
	"even","new","want","because","any","these","give","day","most","us"
];

export function generateWordSequence(count: number, words: string[] = defaultWords): string[] {
	const result: string[] = [];
	for (let i = 0; i < count; i++) {
		const index = Math.floor(Math.random() * words.length);
		result.push(words[index]);
	}
	return result;
}

export function getDefaultWords(): string[] {
	return defaultWords.slice();
}


