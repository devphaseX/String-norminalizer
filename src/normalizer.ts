const normalizeFormat = [
  'NFC',
  'NFD',
  'NFKC',
  'NFKD',
] as const;

type NormaliseFormatType = typeof normalizeFormat[number];

type StringNormalResultEncoding = {
  encodeInfo: NormalizeStringEncoding;
  normalizeForm: Record<
    NormaliseFormatType,
    NormalizeStringEncoding
  >;
};

type NormaliserResult = Record<
  string,
  StringNormalResultEncoding
>;

type NormalizeStringEncoding = {
  codePoint: number;
  get hexForm(): string;
};

type NormalizerResult = Array<
  Record<NormaliseFormatType, NormalizeStringEncoding>
>;

function getCodePoint(char: string): number | undefined {
  if (char.length > 0) {
    return char.codePointAt(0)!;
  }
  return undefined;
}

export function getCharNormalizeForm(
  value: string | string[]
): NormaliserResult {
  if (value.length > 1 || Array.isArray(value)) {
    return Object.assign(
      {},
      ...Array.from(value, getCharNormalizeForm)
    );
  }

  const normaliseForm = Object.assign(
    {},
    ...stringNormalizer(value)
  );
  return {
    [value]: {
      encodeInfo: getEncodeInfo(value),
      normalizeForm: normaliseForm,
    },
  };
}

export function getEncodeInfo(
  normalizedValue: string
): NormalizeStringEncoding {
  return Object.freeze({
    codePoint: getCodePoint(normalizedValue)!,
    get hexForm() {
      const adddedZero =
        4 - this.codePoint.toString().length;
      return this.codePoint
        .toString(16)
        .padStart(6, `0x${'0'.repeat(adddedZero)}`);
    },
  });
}

export function stringNormalizer(
  value: string
): NormalizerResult {
  return normalizeFormat.map(
    (nf) =>
      ({
        [nf]: getEncodeInfo(value.normalize(nf)),
      } as Record<
        NormaliseFormatType,
        NormalizeStringEncoding
      >)
  );
}

export function isNormalizable(
  value: string,
  safe?: boolean
) {
  if (!safe && value.length !== 1) {
    throw new RangeError(
      `Expected a character but got (a/an) empty string or string: ${value} or 
      to safely parse a string pass a true as the safe option.`
    );
  }

  value = value.substr(0, 1); //ensure that the value contained is a character

  const { [value]: normalize } =
    getCharNormalizeForm(value);
  const {
    encodeInfo: { hexForm },
    normalizeForm: normaliseForm,
  } = normalize;
  return normalizeFormat.some(
    (nft) => normaliseForm[nft].hexForm === hexForm
  );
}

export function getCharNormalizerForms(value: string) {
  const normalizer = getCharNormalizeForm(value);
  const chars = Object.keys(normalizer);
  if (chars.length > 0) {
    return Object.assign(
      {} as NormaliserResult,
      ...chars.map((char) => {
        const {
          encodeInfo: { hexForm },
          normalizeForm,
        } = normalizer[char];
        const normalizeCompatible: Array<NormalizeStringEncoding> =
          [];

        normalizeFormat.forEach((nft) => {
          if (normalizeForm[nft].hexForm === hexForm) {
            normalizeCompatible.push(normalizeForm[nft]);
          }
        });
        return {
          [char]: {
            encodeInfo: getEncodeInfo(char),
            normalizable: normalizeCompatible,
          },
        };
      })
    );
  }
  return null;
}
