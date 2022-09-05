# Read Me

This script will garble a provided message using either the intelligibility percentage provided or by dividing the receiver's intelligence by the sender's intelligence.

We garble the message in several ways:

- reordering of words in message
- word replacement with synonyms
- letter replacement
- [zalgo](https://lingojam.com/ZalgoText)

Additionally, we colorize the output text to represent sentiment analysis.

- **red**: negative
- **purple**: neutral
- **blue**: positive

## Execution

- `node FarSpeech.js --s <senderInt> --r <receiverInt> --m "hello world"`
- `node FarSpeech.js --p <percentComprehension> --m "hello world"`

### Flags

- `--s`: sender intelligence (required if using receiver)
- `--r`: receiver intelligence (required if using sender)
- `--p`: percentage (required if not using send/receive)
- `--m`: message (required)
