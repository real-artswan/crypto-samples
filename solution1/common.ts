export function invertCase(ch: string): string {
    return String.fromCharCode(ch.charCodeAt(0) ^ 32);
}

export function xorBuffers(buffs: Buffer[]): Buffer {
    const xorCount = Math.min(...buffs.map((v)=> v.length));
    const result = new Buffer(xorCount);
    for (let i = 0; i < xorCount; i++) {
        result[i] = 0;
        for (let j = 0; j < buffs.length; j++)
            result[i] = result[i] ^ buffs[j][i];
    }

    return result;
}

export class Pos {
    constructor (readonly index: number, readonly msg: number) { };

    //means all this positions the same
    private _sameValue: Set<Pos> = new Set<Pos>();
    //existing value here means this pos is letter with mirror case in relation to linked
    private _mirrorLetter: Set<Pos> = new Set<Pos>();
    //means this pos is defined letter or is space and linked positions are otherwise
    private _maybeValue: string = "";
    private _maybeLink: Set<Pos> = new Set<Pos>();
    //final decrypted value
    realValue: string;

    setMaybeValue(value: string, link: Pos) {
        if (this._maybeLink.has(link))
            return;
        this._maybeLink.add(link);
        if (this._maybeValue && this._maybeValue != value) {
            this.finalize(" ");
            return;
        }
        this._maybeValue = value; 
        link.setMaybeValue(value, this);
        
        this._sameValue.forEach(
            v=>{v.setMaybeValue(value, link)}
        )

        if (this._mirrorLetter.size > 0) {
            this.finalize(value);
        }
    }

    sameAs(pos: Pos) {
        //merge links to the same positions
        if (this == pos || this._sameValue.has(pos))
            return;
        this._sameValue.add(pos);

        //add all the same from pos to this
        pos._sameValue.forEach(
            v=>this.sameAs(v));

        //add all links to mirrors
        pos._mirrorLetter.forEach(
            v=>this.mirrorLetterOf(v));

        //make maybe value the same
        if (pos._maybeValue) {
            this.setMaybeValue(pos._maybeValue, pos);
        } 

        //make pos the same as this
        pos.sameAs(this);
    }

    mirrorLetterOf(pos: Pos) {
        if (this._mirrorLetter.has(pos))
            return;
        this._mirrorLetter.add(pos);
        this._sameValue.forEach(
            v=>{v.mirrorLetterOf(pos)});   
        //we know it is definitely letter here
        if (this._maybeValue) {
            this.finalize(this._maybeValue);
        } 

        pos.mirrorLetterOf(this);
    }

    finalize(ch: string) {
        if (this.realValue) //already finalized
            return;
        this.realValue = ch; //final value
        
        this._sameValue.forEach(p=>{
            p.finalize(ch);
        });    
        
        this._mirrorLetter.forEach(p=>{
            if (ch == " ")
                throw "Should not be space here";
            p.finalize(invertCase(ch));
        });
        this._maybeLink.forEach(p=>{
            if (ch == " ")
                p.finalize(p._maybeValue);
            else
                p.finalize(" ");
        })

    }
}