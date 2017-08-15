const
	Salsa20 = require("./salsa20"), // https://gist.github.com/dchest/4582374
	crypto = require("crypto"); //for source of randomness

const
	xorBytes = (a, b) => {
		const outLen = Math.min(a.length, b.length);

		const out = new Buffer(outLen);
		for (let i = 0; i < outLen; i++) {
			out[i] = a[i] ^ b[i];
		}
		return out;
	},

	decrypt = xorBytes,
	encrypt = xorBytes, //yep, its the same both ways due to the xor operation

	IV = crypto.randomBytes(8),
	KEY = crypto.randomBytes(32),
	PT = new Buffer("Pay Bob $10", "ascii");

// encrypt:
const
	//one stream
	encPRG = new Salsa20(KEY, IV),
	CT = encrypt(PT, encPRG.getBytes(PT.length)),
	CT2 = encrypt(PT, encPRG.getBytes(PT.length)),
	//start another stream
	encPRG2 = new Salsa20(KEY, IV),
	CT3 = encrypt(PT, encPRG2.getBytes(PT.length));
console.log("CT as text\t" + CT.toString("ascii"));
console.log("CT as hex\t" + CT.toString("hex"));
console.log("CT2 as hex\t" + CT2.toString("hex"));
console.log("CT3 as hex\t" + CT3.toString("hex"));

// decrypt:
const
	//one stream
	decPRG = new Salsa20(KEY, IV),
	decPT = decrypt(CT, decPRG.getBytes(CT.length)),
	decPT2 = decrypt(CT2, decPRG.getBytes(CT2.length)),
	//another stream
	decPRG2 = new Salsa20(KEY, IV),
	decPT3 = decrypt(CT3, decPRG2.getBytes(CT3.length));
console.log("Decrypted PT\t" + decPT.toString("ascii"));
console.log("Decrypted PT2\t" + decPT2.toString("ascii"));
console.log("Decrypted PT3\t" + decPT3.toString("ascii"));

//tampering (k^m)^m2^m = k^m2
const
	tamperedCT = Buffer.from(CT);

tamperedCT[tamperedCT.length - 1] = CT[CT.length - 1] ^ "0".charCodeAt(0) ^ "9".charCodeAt(0);
console.log("Tampered CT\t" + tamperedCT.toString("hex"));

const
	//start new decryption stream to demonstrate tampering
	decPRG3 = new Salsa20(KEY, IV),
	tamperedPT = decrypt(tamperedCT, decPRG3.getBytes(tamperedCT.length));
console.log("Tampered PT\t" + tamperedPT.toString("ascii"));

//hack two-time pad
const
	PT2 = new Buffer("Do not reuse key/IV pair", "ascii"),
	hackPRG = new Salsa20(KEY, IV),
	hackableCT = encrypt(PT2, hackPRG.getBytes(PT2.length)),
	xoredPTs = xorBytes(CT, hackableCT);
console.log("Xored PTs\t" + xoredPTs.toString("hex"));
console.log("Xored as text\t" + xoredPTs.toString("ascii"));
console.log("hint: space (32) xor char = invert case");