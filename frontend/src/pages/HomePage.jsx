import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getGalleryImages, resolveGalleryImageUrl } from '../services/gallery';

const teamMembers = ['노예림', '백유안', '서기표', '유승호', '최재우'];

const menuNotes = [
  'MZC는 제철 식재료와 정교한 조리 과정을 바탕으로 코스 요리를 선보입니다.',
  '예약 후 식사 시간은 약 2시간 정도 소요될 수 있습니다.',
  '알레르기 또는 식이 제한 사항이 있다면 예약 전에 미리 알려주세요.',
  '시장 상황에 따라 일부 식재료와 메뉴 구성은 변경될 수 있습니다.',
];

const infoBlocks = [
  {
    title: 'Hours',
    lines: [
      '월 - 일 12:00 - 22:00 (라스트 오더 19:00)',
      '비정기 휴무는 예약 페이지 공지를 참고해주세요.',
    ],
  },
  {
    title: 'Menu',
    lines: ['테이스팅 코스', '350,000원'],
  },
  {
    title: 'Contact',
    lines: ['서울특별시 강남구 논현로85길 46', '(+82) 2-1234-5678'],
  },
];

const mapEmbedUrl =
  'https://www.google.com/maps?q=%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C%20%EA%B0%95%EB%82%A8%EA%B5%AC%20%EB%85%BC%ED%98%84%EB%A1%9C85%EA%B8%B8%2046&output=embed';

const galleryImages = [
  '/assets/MZC 전경 1.png',
  '/assets/MZC 전경 2.png',
  '/assets/MZC 전경 3.png',
  '/assets/전복과 우니, 유자폼.png',
  '/assets/들기름 메밀면 파스타와 구운 가리비.png',
  '/assets/구운한우채끝과 계절채소 구이.png',
  '/assets/흑임자아이스크림과 조청 떡케이크.png',
  '/assets/설록진.png',
];

export function HomePage() {
  const [galleryItems, setGalleryItems] = useState(
    galleryImages.map((image) => ({ url: image })),
  );
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
  const [showScrollTopButton, setShowScrollTopButton] = useState(false);

  useEffect(() => {
    let ignore = false;

    getGalleryImages()
      .then((response) => {
        if (ignore) {
          return;
        }

        if (Array.isArray(response.items) && response.items.length > 0) {
          const uploadedItems = response.items.filter(
            (item) => typeof item?.url === 'string' && item.url.length > 0,
          );
          const fallbackItems = galleryImages.map((image) => ({ url: image }));
          const mergedItems = [...uploadedItems, ...fallbackItems].filter(
            (item, index, items) =>
              items.findIndex((candidate) => candidate.url === item.url) === index,
          );
          setGalleryItems(mergedItems);
        }
      })
      .catch(() => {
        // Keep bundled images as a fallback.
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    setCurrentGalleryIndex(0);
  }, [galleryItems.length]);

  useEffect(() => {
    function handleScroll() {
      setShowScrollTopButton(window.scrollY > 420);
    }

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const hasGalleryItems = galleryItems.length > 0;
  const currentGalleryItem = hasGalleryItems
    ? galleryItems[currentGalleryIndex % galleryItems.length]
    : null;

  function showPreviousGalleryImage() {
    if (!hasGalleryItems) {
      return;
    }

    setCurrentGalleryIndex((current) =>
      current === 0 ? galleryItems.length - 1 : current - 1,
    );
  }

  function showNextGalleryImage() {
    if (!hasGalleryItems) {
      return;
    }

    setCurrentGalleryIndex((current) => (current + 1) % galleryItems.length);
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="restaurant-page">
      <section
        className="hero-landing mzc-hero home-hero-full"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(18, 15, 12, 0.18) 0%, rgba(18, 15, 12, 0.74) 100%), url('/assets/MZC 전경 1.png')",
        }}
      >
        <header className="top-nav top-nav-sticky">
          <div className="brand-block">
            <a href="#" className="brand-name" aria-label="Go to home top">
              MZC.
            </a>
          </div>
          <nav className="nav-links nav-links-anchor">
            <a href="#team">TEAM</a>
            <a href="#menu">MENU</a>
            <a href="#info">INFO</a>
            <a href="#gallery">GALLERY</a>
            <a href="#reservation">RESERVATION</a>
          </nav>
        </header>

        <div className="hero-copy-block hero-copy-centered">
          <div className="hero-logo-stack">
            <img
              className="hero-logo-image"
              src="/assets/mzc_logo_white-Photoroom.png"
              alt="MZC logo"
            />
            <h1>MZC.</h1>
          </div>
        </div>
      </section>

      <main className="content-section stacked-home-sections">
        <section id="team" className="anchor-section home-anchor-section">
          <div className="section-title-block section-title-compact">
            <h2>Team</h2>
          </div>
          <div className="team-list">
            {teamMembers.map((member) => (
              <article key={member} className="team-row">
                <p className="team-member-name">{member}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="menu" className="anchor-section home-anchor-section">
          <div className="section-title-block section-title-compact">
            <h2>Menu</h2>
          </div>
          <div className="copy-column">
            {menuNotes.map((note) => (
              <p key={note} className="long-copy">
                {note}
              </p>
            ))}
          </div>
        </section>

        <section id="info" className="anchor-section home-anchor-section">
          <div className="section-title-block section-title-compact">
            <h2>Information</h2>
          </div>
          <div className="info-layout-vertical">
            {infoBlocks.map((block) => (
              <article key={block.title} className="info-row">
                <h3>{block.title}</h3>
                <div className="info-row-copy">
                  {block.lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
          <div className="info-map-shell">
            <iframe
              className="info-map-frame"
              title="MZC location map"
              src={mapEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>

        <section id="gallery" className="anchor-section home-anchor-section">
          <div className="section-title-block section-title-compact">
            <h2>Gallery</h2>
          </div>
          <div className="gallery-slider-shell">
            {currentGalleryItem ? (
              <>
                <article className="gallery-card gallery-card-featured">
                  <div
                    className="gallery-photo gallery-photo-featured"
                    style={{
                      backgroundImage: `url('${resolveGalleryImageUrl(
                        currentGalleryItem.url,
                      )}')`,
                    }}
                    aria-label={`MZC gallery ${currentGalleryIndex + 1}`}
                  />
                  <button
                    type="button"
                    className="gallery-arrow gallery-arrow-left"
                    onClick={showPreviousGalleryImage}
                    aria-label="Previous gallery image"
                  >
                    {'<'}
                  </button>
                  <button
                    type="button"
                    className="gallery-arrow gallery-arrow-right"
                    onClick={showNextGalleryImage}
                    aria-label="Next gallery image"
                  >
                    {'>'}
                  </button>
                </article>
                <div className="gallery-slider-controls">
                  <div className="gallery-dots" aria-label="Gallery pagination">
                    {galleryItems.map((item, index) => (
                      <button
                        key={item.url}
                        type="button"
                        className={`gallery-dot${
                          index === currentGalleryIndex ? ' is-active' : ''
                        }`}
                        onClick={() => setCurrentGalleryIndex(index)}
                        aria-label={`Go to gallery image ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <p className="muted">표시할 갤러리 이미지가 없습니다.</p>
            )}
          </div>
        </section>

        <section
          id="reservation"
          className="anchor-section reservation-anchor-section"
        >
          <div className="section-title-block section-title-compact">
            <h2>Reservation</h2>
          </div>
          <div className="reservation-copy-layout">
            <p className="long-copy reservation-intro-copy reservation-stacked-copy">
              <span className="reservation-line">
                MZC는 사전 예약제로 운영되며, 오픈 일정에 맞춰 예약이 진행됩니다.
              </span>
              <span className="reservation-line">
                예약 조회를 통해 기존 예약도 바로 확인하실 수 있습니다.
              </span>
            </p>
            <div className="reservation-notice-list">
              <p className="reservation-notice-title">예약 전 안내</p>
              <p className="long-copy reservation-stacked-copy">
                <span className="reservation-line">
                  예약 인원 변경이 있는 경우 매장으로 미리 연락 부탁드립니다.
                </span>
                <span className="reservation-line">
                  좌석과 서비스는 최종 예약 인원 기준으로 준비됩니다.
                </span>
              </p>
              <p className="long-copy">
                코스 특성상 식사에는 약 2시간 정도가 소요될 수 있습니다.
              </p>
              <p className="long-copy">
                별도 연락 없이 30분 이상 지연될 경우 예약이 자동 취소될 수 있습니다.
              </p>
              <p className="long-copy">
                좌석은 예약 순서와 인원 구성에 맞춰 운영되며 특정 좌석 지정은 어려울 수 있습니다.
              </p>
            </div>
            <div className="hero-actions reservation-cta-row">
              <Link to="/reservation" className="hero-button primary">
                예약하기
              </Link>
              <Link to="/reservation/lookup" className="hero-button secondary">
                예약조회
              </Link>
            </div>
          </div>
        </section>
      </main>

      <button
        type="button"
        className={`scroll-top-button${showScrollTopButton ? ' is-visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Scroll to top"
      >
        ↑
      </button>
    </div>
  );
}
