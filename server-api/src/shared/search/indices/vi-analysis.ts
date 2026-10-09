/** Built-in folding analyzer: "nha hang" matches "nhà hàng", "đ" folds to "d" (docs/ARCHITECTURE.md §9.5). */
export const VI_ANALYSIS = {
  analysis: {
    filter: { vi_fold: { type: 'asciifolding', preserve_original: true } },
    analyzer: { vi_folded: { tokenizer: 'standard', filter: ['lowercase', 'vi_fold'] } },
  },
};
