import { UnitProps } from "./types";
export declare const systems: {
    readonly si: readonly ["m", "meter", "s", "A", "kg", "K", "mol", "rad", "b", "F", "C", "S", "V", "J", "N", "Hz", "ohm", "H", "cd", "lm", "lx", "Wb", "T", "W", "Pa", "ohm", "sr"];
    readonly cgs: readonly ["cm", "s", "A", "g", "K", "mol", "rad", "b", "F", "C", "S", "V", "erg", "dyn", "Hz", "ohm", "H", "cd", "lm", "lx", "Wb", "T", "Pa", "ohm", "sr"];
    readonly us: readonly ["ft", "mi", "mile", "in", "inch", "s", "A", "lbm", "degF", "mol", "rad", "b", "F", "C", "S", "V", "BTU", "lbf", "Hz", "ohm", "H", "cd", "lm", "lx", "Wb", "T", "psi", "ohm", "sr", "hp"];
};
export declare const prefixes: {
    NONE: {
        '': number;
    };
    SHORT: {
        '': number;
        da: number;
        h: number;
        k: number;
        M: number;
        G: number;
        T: number;
        P: number;
        E: number;
        Z: number;
        Y: number;
        d: number;
        c: number;
        m: number;
        u: number;
        n: number;
        p: number;
        f: number;
        a: number;
        z: number;
        y: number;
    };
    LONG: {
        '': number;
        deca: number;
        hecto: number;
        kilo: number;
        mega: number;
        giga: number;
        tera: number;
        peta: number;
        exa: number;
        zetta: number;
        yotta: number;
        deci: number;
        centi: number;
        milli: number;
        micro: number;
        nano: number;
        pico: number;
        femto: number;
        atto: number;
        zepto: number;
        yocto: number;
    };
    BINARY_SHORT_SI: {
        '': number;
        k: number;
        M: number;
        G: number;
        T: number;
        P: number;
        E: number;
        Z: number;
        Y: number;
    };
    BINARY_SHORT_IEC: {
        '': number;
        Ki: number;
        Mi: number;
        Gi: number;
        Ti: number;
        Pi: number;
        Ei: number;
        Zi: number;
        Yi: number;
    };
    BINARY_LONG_SI: {
        '': number;
        kilo: number;
        mega: number;
        giga: number;
        tera: number;
        peta: number;
        exa: number;
        zetta: number;
        yotta: number;
    };
    BINARY_LONG_IEC: {
        '': number;
        kibi: number;
        mebi: number;
        gibi: number;
        tebi: number;
        pebi: number;
        exi: number;
        zebi: number;
        yobi: number;
    };
    BTU: {
        '': number;
        MM: number;
    };
    SHORT_LONG: {
        [s: string]: number;
    };
    BINARY_SHORT: {
        [s: string]: number;
    };
    BINARY_LONG: {
        [s: string]: number;
    };
};
export declare const units: Record<string, UnitProps>;
