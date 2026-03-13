import { Link } from 'react-router-dom';

export function HomeIconLink({ to = '/', className = '', onClick }) {
  const classes = ['icon-link', className].filter(Boolean).join(' ');

  return (
    <Link
      to={to}
      className={classes}
      aria-label="홈으로 이동"
      title="홈으로 이동"
      onClick={onClick}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5.5 9.5V21h13V9.5" />
        <path d="M9.5 21v-6h5v6" />
      </svg>
    </Link>
  );
}
