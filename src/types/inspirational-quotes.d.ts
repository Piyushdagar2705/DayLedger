declare module 'inspirational-quotes' {
  export interface InspirationalQuote {
    text: string;
    author?: string;
    from?: string;
  }

  const Quotes: {
    getQuote: () => InspirationalQuote;
  };

  export default Quotes;
}
