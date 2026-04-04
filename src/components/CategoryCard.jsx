import { useTranslation } from 'react-i18next';
import { translateCategory } from '../utils/i18nHelpers.js';

const CATEGORY_ICONS = {
  'Municipal / GHMC': '🏙️',
  Police: '👮',
  'Traffic Police': '🚦',
  Revenue: '📋',
  Endowments: '🛕',
  'Water Supply': '💧',
  Electricity: '⚡',
  Health: '🏥',
  Education: '🎓',
  'Rural Development': '🌾',
};

export const CATEGORIES = Object.keys(CATEGORY_ICONS);

export default function CategoryCard({ category, selected, onSelect }) {
  const { t } = useTranslation();

  return (
    <button
      onClick={() => onSelect(category)}
      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-150 active:scale-95 text-center
        ${selected
          ? 'border-accent bg-cs-accent/5 ring-2 ring-cs-accent/20'
          : 'border-cs-border bg-white hover:border-accent/30 hover:bg-cs-subtle'}`}
    >
      <span className="text-2xl leading-none">{CATEGORY_ICONS[category]}</span>
      <span className={`text-xs font-medium leading-tight ${selected ? 'text-cs-accent' : 'text-cs-muted'}`}>
        {translateCategory(t, category)}
      </span>
    </button>
  );
}
