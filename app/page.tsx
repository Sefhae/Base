'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, ArrowRight, Menu, X } from 'lucide-react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

const services = [
  [
    '01',
    'Proposals',
    'For the question that changes everything. An intimate setting and photographs that hold on to the surprise.',
    'hero',
  ],
  [
    '02',
    'Birthdays & anniversaries',
    'Big milestones. Small gatherings. A celebration that feels personal, with the moments you’ll want to keep.',
    'moment',
  ],
  [
    '03',
    'Photography & film',
    'Couples, portraits, indoor and outdoor sessions. Tell your story through photographs and moving images.',
    'story',
  ],
];
const faqs = [
  [
    'What experiences can I book?',
    'Get in touch about proposals, birthdays, anniversaries, portrait and couple photography, or videography. Tell us what you have in mind so we can discuss the right approach.',
  ],
  [
    'Where do you work?',
    'We are based in Orlando and work all over Florida. Share your preferred venue or setting in your inquiry so we can confirm the details together.',
  ],
  [
    'How do I find out about pricing?',
    'Every inquiry starts with your occasion, preferred date, location, and ideas. Contact us for current package information and a quote for your experience.',
  ],
  [
    'Can I share a theme or inspiration?',
    'Absolutely. Include the mood, colors, or details you love in your message. We’ll discuss what is possible for your date and location.',
  ],
  [
    'Does an inquiry confirm my booking?',
    'No. Your date and services are confirmed directly with the team. Ask about availability, payment terms, weather arrangements, and any cancellation policy before booking.',
  ],
];
export default function Home() {
  const [menu, setMenu] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!menu) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenu(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [menu]);
  return (
    <>
      <a href="#main" className="skip">
        Skip to content
      </a>
      <header id="top">
        <a href="#top" className="logo" aria-label="BASE Entertainment home">
          BASE
        </a>
        <nav
          id="main-navigation"
          className={menu ? 'open' : ''}
          aria-label="Main navigation"
        >
          {[
            ['Experiences', '#experiences'],
            ['Our approach', '#about'],
            ['Build Your Setup', '/build-your-setup'],
            ['FAQs', '#faqs'],
          ].map(([n, target]) =>
            target.startsWith('/') ? (
              <Link key={target} href={target} onClick={() => setMenu(false)}>
                {n}
              </Link>
            ) : (
              <a key={target} href={target} onClick={() => setMenu(false)}>
                {n}
              </a>
            ),
          )}
        </nav>
        <a className="button nav-cta" href="#contact">
          Plan your moment <ArrowUpRight size={16} />
        </a>
        <button
          ref={menuButton}
          type="button"
          aria-controls="main-navigation"
          className="menu-button"
          aria-label={menu ? 'Close menu' : 'Open menu'}
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X /> : <Menu />}
        </button>
      </header>
      <main id="main">
        <section className="hero">
          <Image
            unoptimized
            width={2500}
            height={1667}
            src="/images/hero.jpg"
            alt="A surprise proposal beside the ocean under a floral arch"
            fetchPriority="high"
          />
          <div className="hero-shade" />
          <div className="hero-copy">
            <p className="eyebrow">
              FLORIDA · PROPOSALS · CELEBRATIONS · PHOTOGRAPHY
            </p>
            <h1>
              Some moments
              <br />
              change <em>everything.</em>
            </h1>
            <p className="hero-description">
              Make yours unforgettable. Thoughtful celebrations
              <br className="desktop" /> and beautiful images, centered on your
              story.
            </p>
            <a className="button light" href="#contact">
              Let’s create your moment <ArrowUpRight size={18} />
            </a>
          </div>
          <div className="hero-bottom">
            <a href="#experiences">
              DISCOVER THE EXPERIENCE <span>↓</span>
            </a>
          </div>
        </section>
        <section className="intro wrap">
          <p className="eyebrow">A FEELING. A MEMORY. FOREVER.</p>
          <h2>
            Be fully in the moment.
            <br />
            <em>We’ll help you remember it.</em>
          </h2>
          <p>
            From a heartfelt “yes” to another year together, BASE brings a
            considered eye to life’s celebrations. Beautiful settings, genuine
            emotion, and a story that feels like you.
          </p>
        </section>
        <section id="experiences" className="experiences wrap">
          <div className="section-head">
            <div>
              <p className="eyebrow">THE EXPERIENCES</p>
              <h2>
                Made for your <em>milestones.</em>
              </h2>
            </div>
            <a className="text-link" href="#contact">
              Find your experience <ArrowUpRight size={18} />
            </a>
          </div>
          <div className="cards">
            {services.map(([n, title, desc, img]) => (
              <a className="experience" key={n} href={'#contact'}>
                <div className="card-image">
                  <Image
                    unoptimized
                    width={2500}
                    height={img === 'hero' ? 1667 : 3750}
                    src={'/images/' + img + '.jpg'}
                    alt={
                      title === 'Proposals'
                        ? 'Beach proposal inspiration'
                        : title === 'Birthdays & anniversaries'
                          ? 'An intimate outdoor celebration table'
                          : 'Romantic proposal photography inspiration'
                    }
                    loading="lazy"
                  />
                  <span className="round-arrow">
                    <ArrowUpRight />
                  </span>
                </div>
                <p className="card-number">{n} / THE EXPERIENCE</p>
                <h3>{title}</h3>
                <p>{desc}</p>
              </a>
            ))}
          </div>
        </section>
        <section className="about" id="about">
          <div className="about-image">
            <Image
              unoptimized
              width={2500}
              height={3750}
              src="/images/story.jpg"
              alt="A romantic proposal surrounded by greenery and flowers"
              loading="lazy"
            />
          </div>
          <div className="about-copy">
            <p className="eyebrow">THE BASE APPROACH</p>
            <h2>
              A little intention.
              <br />A lot of <em>feeling.</em>
            </h2>
            <p>
              The details set the scene. You make it meaningful. Our approach
              starts with understanding your occasion and the feeling you want
              to create.
            </p>
            <div className="steps">
              <div>
                <span>01</span>
                <section>
                  <h3>Tell us your story</h3>
                  <p>Share the occasion, the date, and what matters to you.</p>
                </section>
              </div>
              <div>
                <span>02</span>
                <section>
                  <h3>Shape the experience</h3>
                  <p>Discuss your setting, style, and photography or film.</p>
                </section>
              </div>
              <div>
                <span>03</span>
                <section>
                  <h3>Make it a memory</h3>
                  <p>
                    Confirm the details with us, then look forward to your
                    moment.
                  </p>
                </section>
              </div>
            </div>
            <a className="text-link" href="#contact">
              Start a conversation <ArrowRight size={18} />
            </a>
          </div>
        </section>
        <section className="locations wrap" id="locations">
          <p className="eyebrow">BEAUTIFUL MOMENTS, BEAUTIFUL PLACES</p>
          <div className="section-head">
            <h2>
              Your story.
              <br />
              <em>A Florida backdrop.</em>
            </h2>
          </div>
        </section>
        <section className="faq wrap" id="faqs">
          <div>
            <p className="eyebrow">A FEW THINGS TO KNOW</p>
            <h2>
              Before your
              <br />
              <em>big moment.</em>
            </h2>
            <Link className="text-link" href="/get-more-information">
              Ask us a question <ArrowUpRight size={18} />
            </Link>
          </div>
          <Accordion>
            {faqs.map(([q, a], i) => (
              <AccordionItem key={q} value={i}>
                <AccordionTrigger className="faq-trigger">{q}</AccordionTrigger>
                <AccordionContent className="faq-answer">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
        <section className="contact" id="contact">
          <div className="contact-inner">
            <p className="eyebrow">LET’S MAKE SOMETHING MEANINGFUL</p>
            <h2>
              Your next chapter
              <br />
              starts with <em>hello.</em>
            </h2>
            <p>
              Tell us your occasion, preferred date, and location.
              <br />
              We’ll take it from there, together.
            </p>
            <Link className="button light" href="/get-more-information">
              Get more information <ArrowUpRight size={18} />
            </Link>
          </div>
        </section>
      </main>
      <footer>
        <div className="footer-top">
          <a href="#top" className="logo">
            BASE
          </a>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} BASE Entertainment</span>
          <span>Based in Orlando · Serving all of Florida</span>
          <a href="#top">BACK TO TOP ↑</a>
        </div>
      </footer>
    </>
  );
}
