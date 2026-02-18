import { TAG_FUNCTION_MAP, FUNCTION_SIG_MAP, LOOP_SYSTEM_MAP, SIG_CABLE_MAP } from '../../constants/OmniLink';

export const AutoFillService = {
  suggestFromTag(tag, refData) {
    if (!tag || tag.length < 2) return {};
    const firstLetter = tag.charAt(0);
    const suggestions = {};

    const possibleFunctions = TAG_FUNCTION_MAP[firstLetter];
    if (possibleFunctions) {
      const match = refData.functions.find(f => possibleFunctions.includes(f.value));
      if (match) suggestions.function = match;
    }

    return suggestions;
  },

  suggestFromFunction(functionCode) {
    const suggestions = {};
    const sig = FUNCTION_SIG_MAP[functionCode];
    if (sig) suggestions.sig = sig;
    return suggestions;
  },

  suggestFromLoopType(loopType) {
    const suggestions = {};
    const system = LOOP_SYSTEM_MAP[loopType];
    if (system) suggestions.system = system;
    return suggestions;
  },

  getCableSpec(sigCode) {
    return SIG_CABLE_MAP[sigCode] || null;
  }
};
