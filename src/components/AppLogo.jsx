import { Link } from 'react-router-dom';

export default function AppLogo({
  to = '/',
  clickable = true,
  showTitle = true,
  stacked = false,
  imageClassName = 'h-10 w-auto',
  titleClassName = '',
  containerClassName = '',
}) {
  const brandName = 'CivicSnap';

  const content = (
    <>
      <img
        src="/logo.png"
        alt={`${brandName} Logo`}
        className={imageClassName}
        style={{ objectFit: 'contain' }}
      />
      {showTitle && (
        <span className={titleClassName || 'font-semibold text-cs-ink'}>
          {brandName}
        </span>
      )}
    </>
  );

  const className = `${stacked ? 'flex flex-col items-center justify-center gap-3' : 'inline-flex items-center gap-3'} ${containerClassName}`.trim();

  if (!clickable) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Link to={to} className={className} aria-label={brandName}>
      {content}
    </Link>
  );
}
