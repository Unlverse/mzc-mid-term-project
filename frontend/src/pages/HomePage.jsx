import { Link } from 'react-router-dom';

const teamMembers = ['노예림', '백유안', '서기표', '유승호', '최재우'];

const menuNotes = [
  'MZC에서는 엄선된 식재, 최상의 테크닉을 다양한 방식으로 즐길 수 있도록 구성한 코스 요리를 제공합니다.',
  '예약 시 식사에 약 2 시간 정도가 소요됨을 고려 부탁 드립니다.',
  '특정 음식에 대한 제약 사항이 있는 고객께서는 예약 시 미리 알려주시면 감사하겠습니다.',
  '또한 필수로 사용되는 일부 식재는 대체가 어려울 수 있음을 양해 부탁 드립니다.',
];

const infoBlocks = [
  {
    title: 'Hours',
    lines: [
      '월 - 일 12:00 - 22:00 (라스트 오더 19시)',
      '비정기적 휴무는 예약 사이트 내 안내를 참조해 주시기 바랍니다.',
    ],
  },
  {
    title: 'Menu',
    lines: ['테이스팅 메뉴', '350,000원'],
  },
  {
    title: 'Contact',
    lines: ['서울특별시 강남구 역삼동 논현로85길 46', '(+82) 2-1234-5678'],
  },
];

const mapEmbedUrl =
  'https://www.google.com/maps?q=%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C%20%EA%B0%95%EB%82%A8%EA%B5%AC%20%EC%97%AD%EC%82%BC%EB%8F%99%20%EB%85%BC%ED%98%84%EB%A1%9C85%EA%B8%B8%2046&output=embed';

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
            <span className="brand-name">MZC</span>
          </div>
          <nav className="nav-links nav-links-anchor">
            <a href="#team">TEAM</a>
            <a href="#menu">MENU</a>
            <a href="#info">INFO</a>
            <a href="#gallary">GALLARY</a>
            <a href="#reservation">RESERVATION</a>
          </nav>
        </header>

        <div className="hero-copy-block hero-copy-centered">
          <div className="hero-logo-stack">
            <img className="hero-logo-image" src="/assets/MZC_LOGO-removebg-preview.png" alt="MZC logo" />
            <h1>MZC</h1>
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

        <section id="gallary" className="anchor-section home-anchor-section">
          <div className="section-title-block section-title-compact">
            <h2>Gallary</h2>
          </div>
          <div className="gallery-grid gallery-grid-large">
            {galleryImages.map((image, index) => (
              <article key={image} className="gallery-card">
                <div
                  className="gallery-photo"
                  style={{ backgroundImage: `url('${image}')` }}
                  aria-label={`MZC gallery ${index + 1}`}
                />
              </article>
            ))}
          </div>
        </section>

        <section id="reservation" className="anchor-section reservation-anchor-section">
          <div className="section-title-block section-title-compact">
            <h2>Reservation</h2>
          </div>
          <div className="reservation-copy-layout">
            <p className="long-copy reservation-intro-copy">
              MZC는 사전 예약제로 운영되고 있으며, 온라인 예약, 전화를 통해 예약 가능합니다.
            </p>
            <div className="reservation-notice-list">
              <p className="reservation-notice-title">예약 시 유의 사항</p>
              <p className="long-copy">
                사전에 예약하신 인원에 변경이 있을 경우 매장으로 연락 바랍니다. 예약된 인원보다 적게
                방문하실 경우에는 확정된 예약 인원수에 따라 식사 금액이 청구됨을 양해 부탁 드립니다.
                또한 예약 당일에 추가 인원으로 방문하실 경우 식사 제공이 어려울 수 있으므로, 미리 연락
                주시기 바랍니다.
              </p>
              <p className="long-copy">
                방문하신 인원 수에 맞게 식사가 준비되며, 식사 시간은 2시간 이상 소요됩니다. 별도의
                어린이 메뉴는 준비되어 있지 않으나, 성인 기준 풀 코스 메뉴를 즐기실 수 있으면 어린이
                고객도 예약 가능합니다.
              </p>
              <p className="long-copy">
                사전 연락 없이 30분 이상 늦으실 경우, 노쇼로 간주되어 예약금 환불 및 식사 이용이 어려운
                점 양해 부탁 드립니다.
              </p>
              <p className="long-copy">
                테이블과 좌석 배치는 예약 주신 순서와 인원에 맞게 이루어지며, 특정 좌석 지정 요청은
                반영이 어려울 수 있습니다.
              </p>
            </div>
            <div className="hero-actions reservation-cta-row">
              <Link to="/reservation" className="hero-button primary">
                예약하기
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
