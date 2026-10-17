// Stripr mainnet deployment. Sources (NetLayerLabs/Stripr @ 0f5a303):
//   program id      programs/stripr/src/lib.rs (declare_id!), app/src/idl/stripr.json "address"
//   market accounts README.md "Fifteen markets" table
//   xStock mints    app/src/config/deployment.json "mainnet-beta".tokens
//   PT/YT mints     read from each market account (pt_mint, yt_mint); re-checked on every read
// Each market was checked on mainnet on 2026-10-17: owned by the program, Market
// discriminator, 257 bytes, underlying_mint equal to the mint below, USDC dividends.

export const PROGRAM_ID = "9wpHmYvuq7qrAuH4VV3LyC54d2VyTYFMfveMMph2nzZF";
export const TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

export type Market = { ticker: string; name: string; market: string; mint: string; ptMint: string; ytMint: string };

export const MARKETS: readonly Market[] = [
  { ticker: "AAPLx", name: "Apple xStock", market: "2iZTHsJWMP78s5QARZrNNzFVLiSHMGAjyj8SzM6iNTjC", mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp", ptMint: "9hwVgLwdQPgQWgpTS7bNUFtdSdxrgnJLK6ECQXw4Wjs2", ytMint: "3vhBpJGvr7qsQGNu2JCTNYSn3RPhka6eFWmY8EZcCmCm" },
  { ticker: "AMZNx", name: "Amazon xStock", market: "99qu6rB3MxLZKpYKv1H3XsGL93s9YodPgecroXpFt4em", mint: "Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg", ptMint: "ASKdvWQZzm6v5CPG3SNaqbzZQ3H64dj6Evzndb2W5EgQ", ytMint: "Hqqn8jygbSCidTaugqJ28w8kq74CNc7hAvQZ88aCZB5p" },
  { ticker: "COINx", name: "Coinbase xStock", market: "7cq1bVESWKkcsqUKnqxygE7ZEAYS8oyMFpx8FKHCCEZS", mint: "Xs7ZdzSHLU9ftNJsii5fCeJhoRWSC32SQGzGQtePxNu", ptMint: "GJeu5Hf6PYSbaT1nyABtmS1G5Qym23Jn7sVgn2dsxoMq", ytMint: "BW8A46RadvNJMbrB1xgJFJc6sz5zzMHc3aFqBmDCFkz4" },
  { ticker: "GOOGLx", name: "Alphabet xStock", market: "GcvUEbszaNmH5656nS8ZaCD4anPK2YoZCYZrrZKTaqQV", mint: "XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN", ptMint: "AyUFuPV71kivYWH7QR6rVisiz6sWEZY3LdPqczi2zfkN", ytMint: "GMqtV3sVg6jinDR8aaidfccAozaoeShahkZtC4sU4YfK" },
  { ticker: "JNJx", name: "Johnson & Johnson xStock", market: "CxUKQ1zGSVaJiwLGtb2V29E4GaDMF5yZ86E5B33oA56a", mint: "XsGVi5eo1Dh2zUpic4qACcjuWGjNv8GCt3dm5XcX6Dn", ptMint: "7hESmnVA6aQcH4uSnCGDZkGSHJ5ehX6oVKkWRBjEYyj3", ytMint: "GVBrJoxk8r9SSUETSwwD9bwL9j2GBvgeSEijkdt47uJJ" },
  { ticker: "KOx", name: "Coca-Cola xStock", market: "9jBcvD9aze6EaFZRsaYTd3UFzoTHgtRsh4EuyFAaobeB", mint: "XsaBXg8dU5cPM6ehmVctMkVqoiRG2ZjMo1cyBJ3AykQ", ptMint: "DbN4PPJKVrLBeZ3So6NAMP1ztABhWpmvGPGV8vbBxjsg", ytMint: "3YyFLePNpw5qNww9GRmc3L8jr1nzd4QnixULzyJisMYT" },
  { ticker: "MCDx", name: "McDonald's xStock", market: "36a69s32YS3EPmSWWzPg9ZvidUimELUFGr3DXN7qgkPB", mint: "XsqE9cRRpzxcGKDXj1BJ7Xmg4GRhZoyY1KpmGSxAWT2", ptMint: "39bf8TM7tGT2azarJostuJAeeJgXyXCKc1ucYn3xfUFy", ytMint: "5KR1TsGqeEkrfyR2tjB2HF8efX22KUWavm8wzbATj1ep" },
  { ticker: "METAx", name: "Meta xStock", market: "CeFhFzH2sTuyL9YATdpHKMdoQz16rzaS3GeRzjH9AQwz", mint: "Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu", ptMint: "ButnDemotguPEYKFJdiDkctRJT79oL8Mrnq7WKAKNKAs", ytMint: "5rGgtaqvEVhq2rSvv4G8tsYGGscupSEuMrEntUkUaFrf" },
  { ticker: "MSFTx", name: "Microsoft xStock", market: "9fqqyq1C84x2xgaLQf166WAgjPfhx2ZHgnwgSgiLXKw7", mint: "XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX", ptMint: "2UZiRn4fDSJzC8mn22C27ygzhQUC3dUJECb3TSHLhgo3", ytMint: "7FDcKCMzrQHUMumdpnj5D3UGuAKYDErwCMTF51R8DXs" },
  { ticker: "MSTRx", name: "MicroStrategy xStock", market: "2R3831uxCs9wUE98S7nEwA7Ly7MXzzM8VRD5b337pLZj", mint: "XsP7xzNPvEHS1m6qfanPUGjNmdnmsLKEoNAnHjdxxyZ", ptMint: "B31VgWDHE5W2nuoRYRnwVoaLavPUh7wCfHK8AbyqAwPm", ytMint: "D4tssra85AcNCd7AATrsruTYBk5T9yZ7Gmin7upQjYqE" },
  { ticker: "NVDAx", name: "NVIDIA xStock", market: "Bv1hnygxeURXW4KGFJrBY1PuAqzpmkTmWWnDDGqQovnt", mint: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh", ptMint: "FcyhcZ5htB7dHZXJ9hxqBrjT9Qi7gcz4zU6jBRsmtrin", ytMint: "DCnhpmCto1qFCzR3Cfv55Pka2kt615WFjxRMunbLYqEG" },
  { ticker: "PGx", name: "Procter & Gamble xStock", market: "7LnhwQ2RKHxAVWpZT7wR3815iFTEcaWs53V41NX4nX37", mint: "XsYdjDjNUygZ7yGKfQaB6TxLh2gC6RRjzLtLAGJrhzV", ptMint: "8jYV4sthUBNTXMjUC6ebS3Fqm84Rq3eiNGTd53z4cn1o", ytMint: "Ao4eyEsY5dtx9j6mTMzMWVUtAsyeXpHZjtNBPavhJwCi" },
  { ticker: "QQQx", name: "Nasdaq xStock", market: "7kyGZitMYDeDF8ty36GofLTpB9C2eC89AgYFLCzUCB5c", mint: "Xs8S1uUs1zvS2p7iwtsG3b6fkhpvmwz4GYU3gWAmWHZ", ptMint: "4tFMKAA27it19EDrxBcGUbnq3MrgJPRecWbSiJpYFgzb", ytMint: "8LD68jJfcysFkZM5pJogVD7HpKmgQbXrBaVnYtobFdsh" },
  { ticker: "SPYx", name: "SP500 xStock", market: "7hUi98wVdrakk7AKHSxYCXmRZR1HQSejbiNHYZu5k27w", mint: "XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W", ptMint: "DLmLdLrhjh7XzkviRYpU6dYHTQWUATNWHRwLfWXrW9P7", ytMint: "9fQZiD56Z1f27G7SnrEDnjZ1bxofZXQsvyUcR2JZohue" },
  { ticker: "TSLAx", name: "Tesla xStock", market: "G1LUzJuUknoE4AZsFCYs1YSjP8vuLvgkSbb4rZKGJUjW", mint: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB", ptMint: "ATSK8fEkULBm9fQw62j8uUvy4ayGjyeJp4ECRFwuQB1z", ytMint: "xLged3tagaR2T4y5PEXCfomGuZkdttHzkN9K8vCV7eD" },
];

/** Accepts "AAPLx", "aaplx" or "AAPL". Returns undefined for anything else. */
export function findMarket(ticker: string): Market | undefined {
  const wanted = ticker.trim().toLowerCase().replace(/x$/, "");
  return MARKETS.find((m) => m.ticker.toLowerCase().replace(/x$/, "") === wanted);
}
