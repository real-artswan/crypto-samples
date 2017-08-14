const
	Salsa20 = require("./salsa20"), // https://gist.github.com/dchest/4582374
	crypto = require("crypto"); //for random

	xorBytes = (a, b) => {
		const outLen = Math.min(a.length, b.length);

		const out = new Buffer(outLen);
		for (let i = 0; i < outLen; i++) {
			out[i] = a[i] ^ b[i];
		}
		return out;
	};

	Salsa20.prototype.decrypt = function(inBytes) {
		return xorBytes(inBytes, this.getBytes(inBytes.length));
	};
	Salsa20.prototype.encrypt = Salsa20.prototype.decrypt; //yep, its the same both ways due to the xor operation

const
	IV = crypto.randomBytes(8);
	KEY = crypto.randomBytes(32);
	PT = new Buffer("Pay Bob $10", "ascii");

// encrypt:
const
	//one stream
	encryptor = new Salsa20(KEY, IV);
	CT = encryptor.encrypt(PT);
	CT2 = encryptor.encrypt(PT);
	//start another stream
	encryptor2 = new Salsa20(KEY, IV);
	CT3 = encryptor2.encrypt(PT);
console.log("CT as text\t" + CT.toString("ascii"));
console.log("CT as hex\t" + CT.toString("hex"));
console.log("CT2 as hex\t" + CT2.toString("hex"));
console.log("CT3 as hex\t" + CT3.toString("hex"));

// decrypt:
const
	//one stream
	decryptor = new Salsa20(KEY, IV);
	decPT = decryptor.decrypt(CT);
	decPT2 = decryptor.decrypt(CT2);
	//another stream
	decryptor2 = new Salsa20(KEY, IV);
	decPT3 = decryptor2.decrypt(CT3);
console.log("Decrypted PT\t" + decPT.toString("ascii"));
console.log("Decrypted PT2\t" + decPT2.toString("ascii"));
console.log("Decrypted PT3\t" + decPT3.toString("ascii"));

//tampering (k^m)^m2^m = k^m2
const
	tamperedCT = Buffer.from(CT);

tamperedCT[tamperedCT.length - 1] = CT[CT.length - 1] ^ "0".charCodeAt(0) ^ "9".charCodeAt(0);
const
	//start new decryption stream to demonstrate tampering
	decryptor3 = new Salsa20(KEY, IV);
	tamperedPT = decryptor3.decrypt(tamperedCT);

console.log("Tampered CT\t" + tamperedCT.toString("hex"));
console.log("Tampered PT\t" + tamperedPT.toString("ascii"));

//hack two-time pad
const
	PT2 = new Buffer("Do not reuse key/IV pair", "ascii");
	hackableEncryptor = new Salsa20(KEY, IV);
	hackableCT = hackableEncryptor.encrypt(PT2);
	xoredPTs = xorBytes(CT, hackableCT);

console.log("Xored PTs\t" + xoredPTs.toString("hex"));
console.log("Xored as text\t" + xoredPTs.toString("ascii"));