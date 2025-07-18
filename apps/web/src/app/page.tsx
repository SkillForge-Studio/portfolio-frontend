export default function Home() {
  return (
      <div>
        <section id="home" style={{
          maxWidth: '1200px',
          margin: '0 auto',
          paddingTop: '120px',
          borderBottom: '1px solid #e0e0e0',
        }}>
          <h2 style={{
            marginBottom: '1rem',
            fontSize: '2rem'
          }}>Вітаю на моєму портфоліо</h2>
          <p>Це спрощена версія сайту портфоліо, яка буде розширюватися в майбутньому.</p>
        </section>

        <section id="projects" style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2rem 0',
          borderBottom: '1px solid #e0e0e0',
          scrollMarginTop: '80px'
        }}>
          <h2 style={{
            marginBottom: '1rem',
            fontSize: '2rem'
          }}>Проекти</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            marginTop: '2rem'
          }}>
            <div style={{
              background: '#ffffff',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '1.5rem'
            }}>
              <h3 style={{
                marginBottom: '0.5rem'
              }}>Проект 1</h3>
              <p>Опис першого проекту буде тут.</p>
            </div>
            <div style={{
              background: '#ffffff',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '1.5rem'
            }}>
              <h3 style={{
                marginBottom: '0.5rem'
              }}>Проект 2</h3>
              <p>Опис другого проекту буде тут.</p>
            </div>
            <div style={{
              background: '#ffffff',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '1.5rem'
            }}>
              <h3 style={{
                marginBottom: '0.5rem'
              }}>Проект 3</h3>
              <p>Опис третього проекту буде тут.</p>
            </div>
          </div>
        </section>

        <section id="skills" style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2rem 0',
          borderBottom: '1px solid #e0e0e0',
          scrollMarginTop: '80px'
        }}>
          <h2 style={{
            marginBottom: '1rem',
            fontSize: '2rem'
          }}>Навички</h2>
          <p>Тут буде список технологій та навичок.</p>
        </section>

        <section id="contact" style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2rem 0',
          scrollMarginTop: '80px'
        }}>
          <h2 style={{
            marginBottom: '1rem',
            fontSize: '2rem'
          }}>Контакти</h2>
          <p>Контактна інформація буде розміщена тут.</p>
        </section>
      </div>
  );
}