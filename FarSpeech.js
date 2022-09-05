// #region Imports & Setup
const Analyzer = require('natural').SentimentAnalyzer;
const stemmer = require('natural').PorterStemmer;
const analyzer = new Analyzer('English', stemmer, 'afinn');

const syno = require('synonyms');
const zalgo = require('zalgo-js').default;

const Rainbow = require('rainbowvis.js');
const rainbow = new Rainbow();
rainbow.setSpectrum('#ff4444', '#ff44ff', '#4444ff');

const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv

// I've duplicated the main alphabet so that I can lurch forward without risk of making things *entirely* unreadable.
const alphabet = `-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVXYZ abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVXYZ0123456789 ,.?!@#$%^&*()-_+=<>/'"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVXYZ `;

// Shared variables.
let percent, input;
// #endregion

// #region Random Util
const getRandomInt = (max) => {
    return Math.floor(Math.random() * max);
};

const squareRandom = () => Math.random() * Math.random();

const cubeRandom = () => Math.random() * Math.random() * Math.random();

const hypercubeRandom = () => Math.random() * Math.random() * Math.random();
// #endregion

// #region Garble
const parseFlags = () => {
    try {
        // Handle comprehension percent.
        percent = argv.p || argv.percent;
        if (!percent) {
            const sender = argv.s || argv.sender;
            const receiver = argv.r || argv.receiver;
            if (!sender || !receiver) {
                throw new Error('ERROR: Must provide both sender and receiver if not providing percent.')
            }
            percent = Math.min(1, Math.round(1000 * receiver / sender) / 1000);
        }

        // It's possible the user could enter the percent as "50" instead of ".5", but we'd obviously know what they meant, so just parse it.
        if (percent > 1 && percent <= 100) {
            percent /= 100;
        } else if ((!percent && percent !== 0) || percent > 100 || percent < 0) {
            throw new Error('Unrecognized percent: ' + percent);
        }

        // Handle message
        const message = argv.m || argv.message;
        if (!message) {
            throw new Error('No message provided!');
        }
        input = message.split(' ');
    } catch (e) {
        console.error('Illegal flag expression. Try `npm run far --s 30 --r 20 --m Hello mortals!`');
        throw e;
    }
};

const shiftLetter = (letter, threshold = percent) => {
    const index = alphabet.indexOf(letter);
    const doShift = cubeRandom() > threshold;
    
    return doShift ? alphabet.charAt(index + getRandomInt(52)) : letter;
};

const getRGB = (sentiment) => rainbow.colourAt(10 * sentiment + 50);

const garbleWord = (word, garbleCount, overallSentiment) => {
    if (!word) {
        return word;
    }
    const sentiment = analyzer.getSentiment([word]);
    const rgb = getRGB(sentiment + overallSentiment);
    const startTag = `<a style="color:#${rgb};">`;
    const endTag = `</a>`;
    const doCensor = Math.random() > percent;
    if (doCensor) {
        word = word.split('').map(() => shiftLetter('-', 0)).join('');
        garbleCount.count++;
    }
    const garbled = word
        .split('')
        .map((letter) => squareRandom() > percent
            ? zalgo(shiftLetter(letter), { intensity: () => (1 - percent) * Math.random() })
            : shiftLetter(letter))
        .join('');
    return startTag + garbled + endTag;
};

const arrayMove = (arr, fromIndex, toIndex) => {
    const element = arr[fromIndex];
    arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, element);
};

const getSyno = (word) => {
    const result = syno(word);
    if (!result) {
        return word;
    }
    const options = [word];
    for (let i = 1; (result.n && i < result.n.length) || (result.v && i < result.v.length) || (result.s && i < result.s.length) || (result.r && i < result.r.length); i++) {
        const noun = result.n && result.n[i];
        const verb = result.v && result.v[i];
        const adjective = result.s && result.s[i];
        const adverb = result.r && result.r[i];
        if (noun) {
            options.push(noun);
        }
        if (verb) {
            options.push(noun);
        }
        if (adjective) {
            options.push(adjective);
        }
        if (adverb) {
            options.push(adverb);
        }
    }

    return options[Math.floor(cubeRandom() * options.length)];
};

const garbleMessage = async (message) => {
    message = JSON.parse(JSON.stringify(message));// Clone the array.
    console.log('Prime Message: ' + message.join(' '));

    const overallSentiment = analyzer.getSentiment(message);
    console.log('Overall Sentiment: ' + overallSentiment);

    // Reorder the words
    for (let i = 0; i < message.length; i++) {
        const doShift = squareRandom() > percent;
        if (doShift) {
            arrayMove(message, i, getRandomInt(message.length));
        }
    }
    console.log('Post-Reorder: ' + message.join(' '));

    // Swap the words for synonyms
    message = message.map((word) => getSyno(word));
    console.log('Post-Synonym: ' + message.join(' '));

    // Garble letters in the words
    const garbleCount = { count: 0 };
    message = message.map((word) => garbleWord(word, garbleCount, overallSentiment));
    // console.log('Post Garble: ' + message.join(' '));
    console.log('\n\n');

    // Add in the overview content
    const comprehension = `<a style="color:white"><b>Comprehension:</b> ${percent*100}%</a>&nbsp;`;
    const psychic = `<a style="color:white"><b>Psychic Damage:</b> ${garbleCount.count}/${message.length}</a>&nbsp;`;

    // Merge and return for output.
    return `<p style="background-color:black;">\n&nbsp;${comprehension}\n&nbsp;${psychic}\n___________________<br/>\n&nbsp;${message.join('&nbsp;\n&nbsp;')}<br/>&nbsp;</p>`;
};
// #endregion

// #region Execute
parseFlags();
garbleMessage(input).then(console.log);
// #endregion