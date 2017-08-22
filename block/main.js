const
	crypto = require("crypto"),
	BLOCK_SIZE = 16,
	ALGO = "aes-128-cbc",
	IV = crypto.randomBytes(BLOCK_SIZE);
	KEY = crypto.randomBytes(BLOCK_SIZE),
	PT = new Buffer("Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC");

function formatStream(buff) {
	let i = 0;
	let result = "";
	while (i < buff.length) {
		result += "[" + buff.slice(i, i + BLOCK_SIZE).toString("hex") + "]";
		i += BLOCK_SIZE;
	}
	return result;
}

function encrypt(PT, key) {
	const 
		cipher = crypto.createCipheriv(ALGO, key, IV);

	return Buffer.concat([
		cipher.update(PT),
		cipher.final(),
	]);
}

function decrypt(CT, key) {
	const 
		decipher = crypto.createDecipheriv(ALGO, key, IV);

	const PT = Buffer.concat([
		decipher.update(CT),
		decipher.final(),
	]);
	return PT;
}

//encryption/decryption
const
	CT = encrypt(PT, KEY);

console.log("CT:\t", formatStream(CT), "\tlen:", CT.length);

const
	decPT = decrypt(CT, KEY);

console.log("PT:\t", PT.toString());
console.log("PT:\t", formatStream(PT), "\tlen:", CT.length);

//padding oracle
console.log("Hacking\n");

function askOracle(CT) {
	try {
		const PT = decrypt(CT, KEY);
		//console.log("PT2:\t", PT.toString(), "\t", PT.length);
		return true;
	}
	catch(e) {
		return false;
	}
}

function getByteIndexInBlock(index) {
	return BLOCK_SIZE - index % BLOCK_SIZE;
}

//P′2 = D(C2) ⊕ C′
//C2 = E(P2 ⊕ C1)
//P′2 = D(E(P2 ⊕ C1)) ⊕ C′
//P′2 = P2 ⊕ C1 ⊕ C′

function foundByte(tamperedCT, CT, decryptedPT, index, foundValue) {
	const Ph2 = getByteIndexInBlock(index); //P'2
	const C1 = CT[index]; //C1
	const Ch = foundValue; //C'
	//calc real PT value
	//P2[n] = P′2[n] ⊕ C1[n] ⊕ C′[n]
	const P2 = Ph2 ^ C1 ^ Ch;
	decryptedPT[index + BLOCK_SIZE] = P2;

	//make fake padding
	const myPad = Ph2;
	for(let i = 0; i < myPad; i++) {
		const nextPh2 = myPad + 1; //next P'2
		const nextC1 = CT[index + i]; //next C1
		const nextP2 = decryptedPT[index + BLOCK_SIZE + i]; //next P2
		//calc desired padding value
		//C′[n] = P′2[n] ⊕ C1[n] ⊕ P2[n]
		const nextCh = nextPh2 ^ nextC1 ^ nextP2; //next C'
		tamperedCT[index + i] = nextCh;
	}
}

const decryptedPT = Buffer.alloc(CT.length);
let hackCT = new Buffer(CT);

let currentByteIndex = hackCT.length - BLOCK_SIZE - 1; //start tampering second-to-last block to decrypt last block

while (currentByteIndex >= 0) { //go from last to first byte
	const originalCTByte = CT[currentByteIndex];
	let found = false;
	for (let i = 0; i < 256; i++) { //try all possible values for current byte
		if (i === originalCTByte)
			continue;
		hackCT[currentByteIndex] = i;
		if (askOracle(hackCT)) {
			//tampered CT decrypted to something which is padded correctly
			foundByte(hackCT, CT, decryptedPT, currentByteIndex, i);
			found = true;
			break;
		}
	}
	if (!found) {
		foundByte(hackCT, CT, decryptedPT, currentByteIndex, originalCTByte);
	}
	currentByteIndex--;

	if (getByteIndexInBlock(currentByteIndex) == 1) //cut tail block
		hackCT = new Buffer(CT.slice(0, hackCT.length - BLOCK_SIZE));
}
console.log("PT:\t", formatStream(decryptedPT));
console.log(decryptedPT.toString());