import { useEffect } from 'react'
import { Link } from 'react-router'
import base from './landing.module.css'
import styles from './legal.module.css'
import { PublicFooter } from './public-footer.jsx'
import { PublicHeader } from './public-header.jsx'

const UPDATED = '19 November 2026'

const PRIVACY = [
  {
    title: 'Who we are',
    body: [
      'Speechomania is a learning platform for autistic children, made by Autism Synergies in India. Autism Synergies decides how the information on Speechomania is used and is responsible for keeping it safe.'
    ]
  },
  {
    title: 'What we keep',
    list: [
      'About the parent or guardian: name and email address (from your Google account or the invitation we sent you), and a phone number if you or our team add one.',
      'About your child: the first name or nickname you give us, a picture choice, sound and motion settings, and which lessons and checks are given to them.',
      'Learning progress: which games your child plays, their answers, stars and scores, and how long they take.',
      'Notes written by your child’s mentor. You see the notes the mentor shares with you.',
      'A record of important actions, such as signing up, changes to a child and deletion requests. It holds account ids and dates, not names.'
    ]
  },
  {
    title: 'What we do not do',
    list: [
      'We do not sell or rent anyone’s information.',
      'We do not show ads, and there are no tracking or advertising cookies.',
      'We do not ask for a child’s surname, photo, school or address.',
      'Children never sign in on their own. A parent or guardian opens child mode.'
    ]
  },
  {
    title: 'Why we keep it',
    body: [
      'Only to run Speechomania: to show your child their games, remember their progress, let you and your child’s mentor see how they are doing, and keep the platform safe. A parent or guardian gives consent for this when they add a child.'
    ]
  },
  {
    title: 'Who can see it',
    list: [
      'You see your own children.',
      'A mentor sees only the children given to them, and does not see your email address.',
      'A small Speechomania admin team sees what it needs to run the platform and answer requests.'
    ]
  },
  {
    title: 'Services we use',
    list: [
      'Google Firebase handles sign-in. It keeps your email address and sign-in details.',
      'DigitalOcean hosts the platform and its database on servers in Bengaluru, India.',
      'ElevenLabs makes the spoken voice for lesson words. It only ever receives lesson text, never anything about you or your child.'
    ]
  },
  {
    title: 'On your device',
    body: [
      'Speechomania keeps your sign-in and a child’s screen-time timer in your browser so the platform works. Nothing in your browser is used for tracking.'
    ]
  },
  {
    title: 'How long we keep it',
    body: [
      'We keep your information while your account is open. When we erase an account, the children, their progress and the mentor notes are deleted, and the parent’s name, email address and phone number are removed. Encrypted backup copies are replaced within about five weeks, after which nothing of the account remains.'
    ]
  },
  {
    title: 'Your choices',
    list: [
      'See and correct your children’s details in the Parent area.',
      'Remove a child from the Parent area.',
      'Ask us to erase your account and everything about your children from Account in the Parent area. Our team checks the request and then erases it, or tells you why it cannot yet. You can cancel the request until then.'
    ]
  },
  {
    title: 'Changes',
    body: [
      'If this policy changes in a way that matters, we will show the new version in Speechomania before it applies.'
    ]
  }
]

const TERMS = [
  {
    title: 'Using Speechomania',
    body: [
      'Speechomania is run by Autism Synergies. By signing in you agree to these terms and to our privacy policy.'
    ]
  },
  {
    title: 'Who can sign up',
    body: [
      'Accounts are for parents and guardians, and for mentors and staff invited by our team. Only a parent or legal guardian may add a child, and they must agree to the privacy policy for that child.'
    ]
  },
  {
    title: 'Not a medical service',
    body: [
      'Speechomania supports learning at home and in therapy. It does not diagnose or treat any condition and does not replace a speech therapist, doctor or other professional.'
    ]
  },
  {
    title: 'Your account',
    list: [
      'Keep your sign-in to yourself and stay with your child while they use child mode.',
      'Give correct details, and keep them up to date.',
      'Do not misuse the platform, copy its lessons, or try to reach other people’s information.'
    ]
  },
  {
    title: 'Our lessons',
    body: [
      'The lessons, pictures, voices and games belong to Autism Synergies or the people who licensed them to us. You may use them with your own children on Speechomania.'
    ]
  },
  {
    title: 'Changes and availability',
    body: [
      'We improve Speechomania often, so games and lessons can change. We try to keep it running at all times, but cannot promise it will never be unavailable.'
    ]
  },
  {
    title: 'Closing your account',
    body: [
      'You can ask us to erase your account at any time from Account in the Parent area. We may close an account that breaks these terms.'
    ]
  },
  {
    title: 'Law',
    body: ['These terms follow the laws of India.']
  }
]

function Section({ section }) {
  return (
    <section className={styles.section}>
      <h2>{section.title}</h2>
      {section.body?.map((text) => (
        <p key={text}>{text}</p>
      ))}
      {section.list ? (
        <ul>
          {section.list.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

function LegalPage({ title, intro, sections, other }) {
  useEffect(() => {
    document.title = `${title} · Speechomania`
  }, [title])
  return (
    <div className={base.page}>
      <PublicHeader nav={false} />
      <main className={styles.main}>
        <article className={styles.doc}>
          <p className={base.label}>Last updated {UPDATED}</p>
          <h1>{title}</h1>
          <p className={styles.intro}>{intro}</p>
          {sections.map((section) => (
            <Section key={section.title} section={section} />
          ))}
          <p className={styles.other}>
            See also the <Link to={other.to}>{other.label}</Link>.
          </p>
        </article>
      </main>
      <PublicFooter />
    </div>
  )
}

export function PrivacyView() {
  return (
    <LegalPage
      title="Privacy policy"
      intro="How Speechomania looks after information about families and children."
      sections={PRIVACY}
      other={{ to: '/terms', label: 'terms of use' }}
    />
  )
}

export function TermsView() {
  return (
    <LegalPage
      title="Terms of use"
      intro="The rules for using Speechomania."
      sections={TERMS}
      other={{ to: '/privacy', label: 'privacy policy' }}
    />
  )
}
