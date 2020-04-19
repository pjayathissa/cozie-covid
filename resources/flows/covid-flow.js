export default [
	{
		name: "cough",
		type: "icon",
		requiresAnswer: [],
		questionText: "Do you have a cough?",
		questionSecondText: "",
		iconText: ["yes", "no"],
		iconColors: ["fb-green", "fb-cyan"],
		iconImages: [
			"images/icons/prefer_cold.png",
			"images/icons/prefer_warmer.png",
		],
	},
	{
		name: "cough-difference",
		type: "icon",
		requiresAnswer: [{ question: "cough", value: 11 }],
		questionText: "Is it worse than ",
		questionSecondText: "your normal cough?",
		iconText: ["yes", "no", "same"],
		iconColors: ["fb-green", "fb-cyan", "fb-orange"],
		iconImages: [
			"images/icons/prefer_cold.png",
			"images/icons/prefer_warmer.png",
			"images/icons/outdoor.png",
		],
	},
	{
		name: "cough-severity",
		type: "icon",
		requiresAnswer: [{ question: "cough", value: 11 }],
		questionText: "How frequent is",
		questionSecondText: "your cough?",
		iconText: ["constantly", "moderately", "light"],
		iconColors: ["fb-green", "fb-cyan", "fb-orange"],
		iconImages: [
			"images/icons/prefer_cold.png",
			"images/icons/prefer_warmer.png",
			"images/icons/outdoor.png",
		],
	},
	{
		name: "cough-progress",
		type: "icon",
		requiresAnswer: [{ question: "cough", value: 11 }],
		questionText: "Is your cough",
		questionSecondText: "getting worse?",
		iconText: ["yes", "no", "same"],
		iconColors: ["fb-green", "fb-cyan", "fb-orange"],
		iconImages: [
			"images/icons/prefer_cold.png",
			"images/icons/prefer_warmer.png",
			"images/icons/outdoor.png",
		],
	},
	{
		name: "breathing",
		type: "icon",
		requiresAnswer: [],
		questionText: "Is it difficult to breath?",
		questionSecondText: "",
		iconText: ["yes", "no"],
		iconColors: ["fb-green", "fb-cyan"],
		iconImages: [
			"images/icons/prefer_cold.png",
			"images/icons/prefer_warmer.png",
		],
	},
	{
		name: "breathing-resting",
		type: "icon",
		requiresAnswer: [{ question: "breathing", value: 11 }],
		questionText: "Is it difficult to breath",
		questionSecondText: "while resting?",
		iconText: ["yes", "no"],
		iconColors: ["fb-green", "fb-cyan"],
		iconImages: [
			"images/icons/prefer_cold.png",
			"images/icons/prefer_warmer.png",
		],
	},
	{
		name: "breathing-progress",
		type: "icon",
		requiresAnswer: [{ question: "breathing", value: 11 }],
		questionText: "Is your breathing",
		questionSecondText: "getting worse?",
		iconText: ["yes", "no", "same"],
		iconColors: ["fb-green", "fb-cyan", "fb-orange"],
		iconImages: [
			"images/icons/prefer_cold.png",
			"images/icons/prefer_warmer.png",
			"images/icons/outdoor.png",
		],
	},
	{
		name: "breathing-concern",
		type: "icon",
		requiresAnswer: [{ question: "breathing", value: 11 }],
		questionText: "Are you concerned with",
		questionSecondText: "your breathing?",
		iconText: ["yes", "no"],
		iconColors: ["fb-green", "fb-cyan"],
		iconImages: [
			"images/icons/prefer_cold.png",
			"images/icons/prefer_warmer.png",
		],
	},
	{
		name: "fever",
		type: "icon",
		requiresAnswer: [],
		questionText: "Do you have a fever?",
		questionSecondText: "",
		iconText: ["yes", "no", "don't know"],
		iconColors: ["fb-green", "fb-cyan", "fb-orange"],
		iconImages: [
			"images/icons/prefer_cold.png",
			"images/icons/prefer_warmer.png",
			"images/icons/outdoor.png",
		],
	},
	{
		name: "fever-concern",
		type: "icon",
		requiresAnswer: [{ question: "fever", value: 11 }],
		questionText: "Are you concerned",
		questionSecondText: "about your fever?",
		iconText: ["yes", "no"],
		iconColors: ["fb-green", "fb-cyan"],
		iconImages: [
			"images/icons/prefer_cold.png",
			"images/icons/prefer_warmer.png",
		],
	},
	{
		name: "thermometer",
		type: "icon",
		requiresAnswer: [],
		questionText: "Do you have a",
		questionSecondText: "thermometer?",
		iconText: ["yes", "no"],
		iconColors: ["fb-green", "fb-cyan"],
		iconImages: [
			"images/icons/prefer_cold.png",
			"images/icons/prefer_warmer.png",
		],
	},
	{
		name: "fever",
		type: "numerical",
		requiresAnswer: [{ question: "thermometer", value: 11 }],
		questionText: "TODO: Add numerical input",
		questionSecondText: "",
		iconText: ["37.0", "37.1", "37.2", "37.3", "37.4", "37.5", "37.6", "37.7", "37.8", "37.9", "38.0"],
		iconColors: ["fb-green", "fb-cyan", "fb-orange"],
		iconImages: [
			"images/icons/prefer_cold.png",
			"images/icons/prefer_warmer.png",
			"images/icons/outdoor.png",
		],
	},
	{
		name: "fever-confirm",
		type: "icon",
		requiresAnswer: [{ question: "fever", value: "determined by code" }],
		questionText: "You selected xxxx",
		questionSecondText: "Is this correct?",
		iconText: ["yes"],
		iconColors: ["fb-green"],
		iconImages: ["images/icons/prefer_cold.png",],
	},
	{
		name: "lethargy",
		type: "icon",
		requiresAnswer: [],
		questionText: "Do you feel tired?",
		questionSecondText: "",
		iconText: ["yes", "no"],
		iconColors: ["fb-green", "fb-cyan"],
		iconImages: [
			"images/icons/prefer_cold.png",
			"images/icons/prefer_warmer.png",
		],
	},
	{
		name: "lethargy-severity",
		type: "icon",
		requiresAnswer: [{ question: "lethargy", value: 11 }],
		questionText: "How severe is your",
		questionSecondText: "tiredness",
		iconText: ["mild", "moderate", "bed-bound"],
		iconColors: ["fb-green", "fb-cyan", "fb-orange"],
		iconImages: [
			"images/icons/prefer_cold.png",
			"images/icons/prefer_warmer.png",
			"images/icons/outdoor.png",
		],
	},
];
