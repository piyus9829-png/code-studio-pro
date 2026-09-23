import { TerminalTheme } from '../types';

export interface TerminalThemeDefinition {
  id: TerminalTheme;
  name: string;
  category: 'Dark' | 'Light';
  description: string;
  preview: {
    bg: string;
    text: string;
    accent: string;
    prompt: string;
  };
  containerBg: string;
  headerBg: string;
  filterBarBg: string;
  borderColor: string;
  textColor: string;
  dimTextColor: string;
  promptColor: string;
  replBg: string;
  replBorder: string;
  replInputBg: string;
  replInputText: string;
  logDefault: string;
  logError: string;
  logWarn: string;
  logInfo: string;
  logStdin: string;
  tabActive: string;
  tabInactive: string;
  statusBadgeSuccess: string;
  statusBadgeError: string;
}

export const TERMINAL_THEMES: Record<TerminalTheme, TerminalThemeDefinition> = {
  'default-dark': {
    id: 'default-dark',
    name: 'VS Code Dark+ (Default)',
    category: 'Dark',
    description: 'Classic deep slate terminal with indigo & emerald accents',
    preview: {
      bg: '#090d16',
      text: '#e2e8f0',
      accent: '#6366f1',
      prompt: '#818cf8',
    },
    containerBg: 'bg-[#090d16]',
    headerBg: 'bg-[#0f172a]',
    filterBarBg: 'bg-[#0f172a]/70',
    borderColor: 'border-slate-800',
    textColor: 'text-slate-200',
    dimTextColor: 'text-slate-500',
    promptColor: 'text-indigo-400',
    replBg: 'bg-[#0f172a]/90',
    replBorder: 'border-slate-800',
    replInputBg: 'bg-transparent',
    replInputText: 'text-slate-100',
    logDefault: 'text-slate-200 bg-slate-900/50 border-slate-800/60',
    logError: 'text-red-300 bg-red-950/30 border-red-900/40',
    logWarn: 'text-amber-300 bg-amber-950/30 border-amber-900/40',
    logInfo: 'text-cyan-300 bg-cyan-950/20 border-cyan-900/30',
    logStdin: 'text-amber-200 bg-amber-950/20 border-amber-900/30',
    tabActive: 'bg-slate-800 text-white shadow-sm border border-slate-700/60',
    tabInactive: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50',
    statusBadgeSuccess: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    statusBadgeError: 'bg-red-500/20 text-red-300 border-red-500/30',
  },

  'solarized-dark': {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    category: 'Dark',
    description: 'Precision low-contrast cyan & teal terminal palette designed by Ethan Schoonover',
    preview: {
      bg: '#002b36',
      text: '#93a1a1',
      accent: '#268bd2',
      prompt: '#2aa198',
    },
    containerBg: 'bg-[#002b36]',
    headerBg: 'bg-[#073642]',
    filterBarBg: 'bg-[#073642]/80',
    borderColor: 'border-[#073642]',
    textColor: 'text-[#93a1a1]',
    dimTextColor: 'text-[#586e75]',
    promptColor: 'text-[#2aa198]',
    replBg: 'bg-[#073642]/95',
    replBorder: 'border-[#586e75]/40',
    replInputBg: 'bg-[#002b36]/60',
    replInputText: 'text-[#93a1a1]',
    logDefault: 'text-[#93a1a1] bg-[#073642]/60 border-[#586e75]/30',
    logError: 'text-[#dc322f] bg-[#dc322f]/10 border-[#dc322f]/30',
    logWarn: 'text-[#b58900] bg-[#b58900]/10 border-[#b58900]/30',
    logInfo: 'text-[#268bd2] bg-[#268bd2]/10 border-[#268bd2]/30',
    logStdin: 'text-[#cb4b16] bg-[#cb4b16]/10 border-[#cb4b16]/30',
    tabActive: 'bg-[#002b36] text-[#2aa198] shadow-sm border border-[#2aa198]/40 font-semibold',
    tabInactive: 'text-[#839496] hover:text-[#93a1a1] hover:bg-[#002b36]/40',
    statusBadgeSuccess: 'bg-[#859900]/20 text-[#859900] border-[#859900]/40',
    statusBadgeError: 'bg-[#dc322f]/20 text-[#dc322f] border-[#dc322f]/40',
  },

  'solarized-light': {
    id: 'solarized-light',
    name: 'Solarized Light',
    category: 'Light',
    description: 'Warm cream terminal with easy-on-the-eyes daylight contrast',
    preview: {
      bg: '#fdf6e3',
      text: '#586e75',
      accent: '#268bd2',
      prompt: '#2aa198',
    },
    containerBg: 'bg-[#fdf6e3]',
    headerBg: 'bg-[#eee8d5]',
    filterBarBg: 'bg-[#eee8d5]/90',
    borderColor: 'border-[#dcd5c0]',
    textColor: 'text-[#586e75]',
    dimTextColor: 'text-[#93a1a1]',
    promptColor: 'text-[#268bd2]',
    replBg: 'bg-[#eee8d5]',
    replBorder: 'border-[#dcd5c0]',
    replInputBg: 'bg-[#fdf6e3]',
    replInputText: 'text-[#073642]',
    logDefault: 'text-[#586e75] bg-[#eee8d5]/70 border-[#dcd5c0]',
    logError: 'text-[#dc322f] bg-[#dc322f]/10 border-[#dc322f]/30',
    logWarn: 'text-[#b58900] bg-[#b58900]/10 border-[#b58900]/30',
    logInfo: 'text-[#268bd2] bg-[#268bd2]/10 border-[#268bd2]/30',
    logStdin: 'text-[#cb4b16] bg-[#cb4b16]/10 border-[#cb4b16]/30',
    tabActive: 'bg-[#fdf6e3] text-[#073642] shadow-sm border border-[#2aa198]/50 font-bold',
    tabInactive: 'text-[#657b83] hover:text-[#073642] hover:bg-[#eee8d5]/70',
    statusBadgeSuccess: 'bg-[#859900]/20 text-[#859900] border-[#859900]/40',
    statusBadgeError: 'bg-[#dc322f]/20 text-[#dc322f] border-[#dc322f]/40',
  },

  'gruvbox-dark': {
    id: 'gruvbox-dark',
    name: 'Gruvbox Dark',
    category: 'Dark',
    description: 'Retro groove warm earthy aesthetic with olive, gold, and orange accents',
    preview: {
      bg: '#282828',
      text: '#ebdbb2',
      accent: '#fabd2f',
      prompt: '#b8bb26',
    },
    containerBg: 'bg-[#282828]',
    headerBg: 'bg-[#1d2021]',
    filterBarBg: 'bg-[#1d2021]/80',
    borderColor: 'border-[#3c3836]',
    textColor: 'text-[#ebdbb2]',
    dimTextColor: 'text-[#928374]',
    promptColor: 'text-[#fabd2f]',
    replBg: 'bg-[#1d2021]/95',
    replBorder: 'border-[#3c3836]',
    replInputBg: 'bg-[#282828]',
    replInputText: 'text-[#ebdbb2]',
    logDefault: 'text-[#ebdbb2] bg-[#3c3836]/40 border-[#504945]/60',
    logError: 'text-[#fb4934] bg-[#fb4934]/15 border-[#fb4934]/40',
    logWarn: 'text-[#fabd2f] bg-[#fabd2f]/15 border-[#fabd2f]/40',
    logInfo: 'text-[#83a598] bg-[#83a598]/15 border-[#83a598]/40',
    logStdin: 'text-[#fe8019] bg-[#fe8019]/15 border-[#fe8019]/40',
    tabActive: 'bg-[#282828] text-[#fabd2f] shadow-sm border border-[#fabd2f]/40 font-bold',
    tabInactive: 'text-[#a89984] hover:text-[#ebdbb2] hover:bg-[#3c3836]/50',
    statusBadgeSuccess: 'bg-[#b8bb26]/20 text-[#b8bb26] border-[#b8bb26]/40',
    statusBadgeError: 'bg-[#fb4934]/20 text-[#fb4934] border-[#fb4934]/40',
  },

  'gruvbox-light': {
    id: 'gruvbox-light',
    name: 'Gruvbox Light',
    category: 'Light',
    description: 'Soft parchment warm light terminal with deep earthy tones',
    preview: {
      bg: '#fbf1c7',
      text: '#3c3836',
      accent: '#b57614',
      prompt: '#79740e',
    },
    containerBg: 'bg-[#fbf1c7]',
    headerBg: 'bg-[#ebdbb2]',
    filterBarBg: 'bg-[#ebdbb2]/90',
    borderColor: 'border-[#d5c4a1]',
    textColor: 'text-[#3c3836]',
    dimTextColor: 'text-[#928374]',
    promptColor: 'text-[#b57614]',
    replBg: 'bg-[#ebdbb2]',
    replBorder: 'border-[#d5c4a1]',
    replInputBg: 'bg-[#fbf1c7]',
    replInputText: 'text-[#282828]',
    logDefault: 'text-[#3c3836] bg-[#f2e5bc]/80 border-[#d5c4a1]',
    logError: 'text-[#9d0006] bg-[#9d0006]/10 border-[#9d0006]/30',
    logWarn: 'text-[#b57614] bg-[#b57614]/10 border-[#b57614]/30',
    logInfo: 'text-[#076678] bg-[#076678]/10 border-[#076678]/30',
    logStdin: 'text-[#af3a03] bg-[#af3a03]/10 border-[#af3a03]/30',
    tabActive: 'bg-[#fbf1c7] text-[#282828] shadow-sm border border-[#b57614]/50 font-bold',
    tabInactive: 'text-[#7c6f64] hover:text-[#282828] hover:bg-[#ebdbb2]/70',
    statusBadgeSuccess: 'bg-[#79740e]/20 text-[#79740e] border-[#79740e]/40',
    statusBadgeError: 'bg-[#9d0006]/20 text-[#9d0006] border-[#9d0006]/40',
  },

  'nord': {
    id: 'nord',
    name: 'Nord Frost',
    category: 'Dark',
    description: 'Arctic icy-blue Scandinavian minimalism with crisp frost accents',
    preview: {
      bg: '#2e3440',
      text: '#d8dee9',
      accent: '#88c0d0',
      prompt: '#81a1c1',
    },
    containerBg: 'bg-[#2e3440]',
    headerBg: 'bg-[#242933]',
    filterBarBg: 'bg-[#242933]/80',
    borderColor: 'border-[#3b4252]',
    textColor: 'text-[#d8dee9]',
    dimTextColor: 'text-[#616e88]',
    promptColor: 'text-[#88c0d0]',
    replBg: 'bg-[#242933]/95',
    replBorder: 'border-[#3b4252]',
    replInputBg: 'bg-[#2e3440]',
    replInputText: 'text-[#eceff4]',
    logDefault: 'text-[#d8dee9] bg-[#3b4252]/40 border-[#434c5e]',
    logError: 'text-[#bf616a] bg-[#bf616a]/15 border-[#bf616a]/40',
    logWarn: 'text-[#ebcb8b] bg-[#ebcb8b]/15 border-[#ebcb8b]/40',
    logInfo: 'text-[#88c0d0] bg-[#88c0d0]/15 border-[#88c0d0]/40',
    logStdin: 'text-[#d08770] bg-[#d08770]/15 border-[#d08770]/40',
    tabActive: 'bg-[#2e3440] text-[#88c0d0] shadow-sm border border-[#88c0d0]/40 font-semibold',
    tabInactive: 'text-[#9aa5ce] hover:text-[#eceff4] hover:bg-[#3b4252]/40',
    statusBadgeSuccess: 'bg-[#a3be8c]/20 text-[#a3be8c] border-[#a3be8c]/40',
    statusBadgeError: 'bg-[#bf616a]/20 text-[#bf616a] border-[#bf616a]/40',
  },

  'dracula': {
    id: 'dracula',
    name: 'Dracula Terminal',
    category: 'Dark',
    description: 'Vibrant purple, pink, and neon green dark terminal theme',
    preview: {
      bg: '#282a36',
      text: '#f8f8f2',
      accent: '#ff79c6',
      prompt: '#50fa7b',
    },
    containerBg: 'bg-[#282a36]',
    headerBg: 'bg-[#1e1f29]',
    filterBarBg: 'bg-[#1e1f29]/80',
    borderColor: 'border-[#44475a]',
    textColor: 'text-[#f8f8f2]',
    dimTextColor: 'text-[#6272a4]',
    promptColor: 'text-[#50fa7b]',
    replBg: 'bg-[#1e1f29]/95',
    replBorder: 'border-[#44475a]',
    replInputBg: 'bg-[#282a36]',
    replInputText: 'text-[#f8f8f2]',
    logDefault: 'text-[#f8f8f2] bg-[#44475a]/40 border-[#6272a4]/40',
    logError: 'text-[#ff5555] bg-[#ff5555]/15 border-[#ff5555]/40',
    logWarn: 'text-[#ffb86c] bg-[#ffb86c]/15 border-[#ffb86c]/40',
    logInfo: 'text-[#8be9fd] bg-[#8be9fd]/15 border-[#8be9fd]/40',
    logStdin: 'text-[#bd93f9] bg-[#bd93f9]/15 border-[#bd93f9]/40',
    tabActive: 'bg-[#282a36] text-[#ff79c6] shadow-sm border border-[#ff79c6]/40 font-bold',
    tabInactive: 'text-[#6272a4] hover:text-[#f8f8f2] hover:bg-[#44475a]/50',
    statusBadgeSuccess: 'bg-[#50fa7b]/20 text-[#50fa7b] border-[#50fa7b]/40',
    statusBadgeError: 'bg-[#ff5555]/20 text-[#ff5555] border-[#ff5555]/40',
  },

  'monokai': {
    id: 'monokai',
    name: 'Monokai Pro',
    category: 'Dark',
    description: 'Iconic neon yellow, magenta, and cyan high-contrast terminal styling',
    preview: {
      bg: '#272822',
      text: '#f8f8f2',
      accent: '#a6e22e',
      prompt: '#f92672',
    },
    containerBg: 'bg-[#272822]',
    headerBg: 'bg-[#1e1f1c]',
    filterBarBg: 'bg-[#1e1f1c]/85',
    borderColor: 'border-[#3e3d32]',
    textColor: 'text-[#f8f8f2]',
    dimTextColor: 'text-[#75715e]',
    promptColor: 'text-[#a6e22e]',
    replBg: 'bg-[#1e1f1c]/95',
    replBorder: 'border-[#3e3d32]',
    replInputBg: 'bg-[#272822]',
    replInputText: 'text-[#f8f8f2]',
    logDefault: 'text-[#f8f8f2] bg-[#3e3d32]/40 border-[#75715e]/40',
    logError: 'text-[#f92672] bg-[#f92672]/15 border-[#f92672]/40',
    logWarn: 'text-[#fd971f] bg-[#fd971f]/15 border-[#fd971f]/40',
    logInfo: 'text-[#66d9ef] bg-[#66d9ef]/15 border-[#66d9ef]/40',
    logStdin: 'text-[#ae81ff] bg-[#ae81ff]/15 border-[#ae81ff]/40',
    tabActive: 'bg-[#272822] text-[#a6e22e] shadow-sm border border-[#a6e22e]/40 font-bold',
    tabInactive: 'text-[#75715e] hover:text-[#f8f8f2] hover:bg-[#3e3d32]/50',
    statusBadgeSuccess: 'bg-[#a6e22e]/20 text-[#a6e22e] border-[#a6e22e]/40',
    statusBadgeError: 'bg-[#f92672]/20 text-[#f92672] border-[#f92672]/40',
  },

  'matrix-green': {
    id: 'matrix-green',
    name: 'Matrix Hacker (Green)',
    category: 'Dark',
    description: 'Retro monochrome CRT phosphor green terminal interface',
    preview: {
      bg: '#050a06',
      text: '#39ff14',
      accent: '#00ff66',
      prompt: '#5af78e',
    },
    containerBg: 'bg-[#050a06]',
    headerBg: 'bg-[#0a140d]',
    filterBarBg: 'bg-[#0a140d]/90',
    borderColor: 'border-[#132c18]',
    textColor: 'text-[#39ff14]',
    dimTextColor: 'text-[#1c742c]',
    promptColor: 'text-[#5af78e]',
    replBg: 'bg-[#0a140d]/95',
    replBorder: 'border-[#132c18]',
    replInputBg: 'bg-[#050a06]',
    replInputText: 'text-[#39ff14]',
    logDefault: 'text-[#39ff14] bg-[#0f2314]/40 border-[#194b23]/50',
    logError: 'text-[#ff4444] bg-[#ff4444]/15 border-[#ff4444]/40',
    logWarn: 'text-[#ffcc00] bg-[#ffcc00]/15 border-[#ffcc00]/40',
    logInfo: 'text-[#5af78e] bg-[#5af78e]/15 border-[#5af78e]/40',
    logStdin: 'text-[#39ff14] bg-[#39ff14]/15 border-[#39ff14]/40',
    tabActive: 'bg-[#050a06] text-[#39ff14] shadow-sm border border-[#39ff14]/50 font-mono font-bold',
    tabInactive: 'text-[#1c742c] hover:text-[#39ff14] hover:bg-[#0f2314]/50',
    statusBadgeSuccess: 'bg-[#39ff14]/20 text-[#39ff14] border-[#39ff14]/40',
    statusBadgeError: 'bg-[#ff4444]/20 text-[#ff4444] border-[#ff4444]/40',
  },
};

export function getTerminalThemeConfig(theme?: TerminalTheme): TerminalThemeDefinition {
  if (theme && TERMINAL_THEMES[theme]) {
    return TERMINAL_THEMES[theme];
  }
  return TERMINAL_THEMES['default-dark'];
}
