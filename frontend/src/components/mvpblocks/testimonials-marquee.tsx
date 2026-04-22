'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Marquee } from '@/components/ui/marquee';

export function Highlight({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'bg-green-500/10 p-1 py-0.5 font-bold text-green-600',
        className,
      )}
    >
      {children}
    </span>
  );
}

export interface TestimonialCardProps {
  name: string;
  role: string;
  img?: string;
  description: React.ReactNode;
  className?: string;
  [key: string]: any;
}

export function TestimonialCard({
  description,
  name,
  img,
  role,
  className,
  ...props // Capture the rest of the props
}: TestimonialCardProps) {
  return (
    <div
      className={cn(
        'mb-4 flex w-full cursor-pointer break-inside-avoid flex-col items-center justify-between gap-6 rounded-xl p-4',
        // theme styles
        'border-border bg-card/50 border shadow-sm',
        // hover effect
        'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md',
        className,
      )}
      {...props}
    >
      <div className="text-muted-foreground text-sm font-normal select-none">
        {description}
        <div className="flex flex-row py-1">
          <Star className="size-4 fill-green-500 text-green-500" />
          <Star className="size-4 fill-green-500 text-green-500" />
          <Star className="size-4 fill-green-500 text-green-500" />
          <Star className="size-4 fill-green-500 text-green-500" />
          <Star className="size-4 fill-green-500 text-green-500" />
        </div>
      </div>

      <div className="flex w-full items-center justify-start gap-5 select-none">
        <img
          width={40}
          height={40}
          src={img || ''}
          alt={name}
          className="size-10 rounded-full ring-1 ring-green-500/20 ring-offset-2"
        />

        <div>
          <p className="text-foreground font-medium">{name}</p>
          <p className="text-muted-foreground text-xs font-normal">{role}</p>
        </div>
      </div>
    </div>
  );
}
const testimonials = [
  {
    name: 'Rahul Sharma',
    role: 'Founder at LocalBites',
    img: 'https://randomuser.me/api/portraits/men/22.jpg',
    description: (
      <p>
        Indian Digital Nomads has completely transformed how we hire.
        <Highlight>
          We found a talented student developer who built our entire ordering system in weeks.
        </Highlight>{' '}
        It&apos;s the perfect platform for fast, reliable local talent.
      </p>
    ),
  },
  {
    name: 'Priya Patel',
    role: 'Freelance Graphic Designer',
    img: 'https://randomuser.me/api/portraits/women/33.jpg',
    description: (
      <p>
        I was struggling to find clients locally before.
        <Highlight>
          Now I have a steady stream of gigs from amazing local businesses.
        </Highlight>{' '}
        The 3-minute speed calls make pitching so much easier and more personal.
      </p>
    ),
  },
  {
    name: 'Aman Gupta',
    role: 'Tech Startup Founder',
    img: 'https://randomuser.me/api/portraits/men/32.jpg',
    description: (
      <p>
        As an early-stage founder, hiring full-time wasn&apos;t an option.
        <Highlight>We found three incredible student freelancers here.</Highlight> They
        helped us launch our MVP three months ahead of schedule.
      </p>
    ),
  },
  {
    name: 'Sneha Reddy',
    role: 'Marketing Freelancer',
    img: 'https://randomuser.me/api/portraits/women/44.jpg',
    description: (
      <p>
        The platform&apos;s focus on proximity and personality is a game-changer.
        <Highlight>
          Clients trust me more because we can connect face-to-face instantly.
        </Highlight>{' '}
        It&apos;s become my primary source of income during my master&apos;s degree.
      </p>
    ),
  },
  {
    name: 'Vikram Singh',
    role: 'Owner at Singh Logistics',
    img: 'https://randomuser.me/api/portraits/men/55.jpg',
    description: (
      <p>
        Our internal dashboard needed an overhaul, and we found the perfect talent here.
        <Highlight>
          The process was incredibly smooth, from the 3-minute intro to the final delivery.
        </Highlight>{' '}
        We&apos;ll definitely be using this for all our future technical needs.
      </p>
    ),
  },
  {
    name: 'Ananya Desai',
    role: 'Freelance Copywriter',
    img: 'https://randomuser.me/api/portraits/women/67.jpg',
    description: (
      <p>
        The simplicity of Indian Digital Nomads is exceptional.
        <Highlight>
          I set up my profile in minutes and got my first client the next day.
        </Highlight>{' '}
        The transparency and ease of communication keep me coming back.
      </p>
    ),
  },
  {
    name: 'Rohan Mehta',
    role: 'Agency Director',
    img: 'https://randomuser.me/api/portraits/men/78.jpg',
    description: (
      <p>
        We often need specialized skills for short-term projects.
        <Highlight>
          This platform gives us access to brilliant student talent instantly.
        </Highlight>{' '}
        Our project delivery times have improved significantly.
      </p>
    ),
  },
  {
    name: 'Kavya Iyer',
    role: 'Freelance Web Developer',
    img: 'https://randomuser.me/api/portraits/women/89.jpg',
    description: (
      <p>
        I love how the platform highlights my skills and personality over just a resume.
        <Highlight>
          I&apos;ve built long-term relationships with three local businesses so far.
        </Highlight>{' '}
        It&apos;s empowering to monetize my skills while still studying.
      </p>
    ),
  },
  {
    name: 'Aditya Verma',
    role: 'Cafe Owner',
    img: 'https://randomuser.me/api/portraits/men/92.jpg',
    description: (
      <p>
        We needed someone to run our social media campaigns.
        <Highlight>
          Found a creative student in our city who completely revamped our online presence.
        </Highlight>{' '}
        The local connection made everything so much more authentic.
      </p>
    ),
  },
  {
    name: 'Neha Kapoor',
    role: 'Freelance UI/UX Designer',
    img: 'https://randomuser.me/api/portraits/women/29.jpg',
    description: (
      <p>
        The direct access to decision-makers through speed calls is amazing.
        <Highlight>
          I don&apos;t have to write long cover letters anymore; my work and personality speak for me.
        </Highlight>{' '}
        Highly recommend this to any student looking to start freelancing.
      </p>
    ),
  },
];

export default function Testimonials() {
  return (
    <section className="relative container py-10">
      {/* Decorative elements */}
      <div className="absolute top-20 -left-20 z-10 h-64 w-64 rounded-full bg-green-500/5 blur-3xl" />
      <div className="absolute -right-20 bottom-20 z-10 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="font-headline text-[#0B1C30] mb-4 text-center text-4xl leading-[1.2] font-bold tracking-tighter md:text-5xl">
          What Our Community Says
        </h2>
        <h3 className="text-[#64748B] mx-auto mb-8 max-w-lg text-center text-lg font-medium tracking-tight text-balance">
          Don&apos;t just take our word for it. Here&apos;s what{' '}
          <span className="bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">
            real freelancers and business owners
          </span>{' '}
          are saying about{' '}
          <span className="font-semibold text-green-600">Indian Digital Nomads</span>
        </h3>
      </motion.div>

      <div className="relative mt-6 max-h-screen overflow-hidden">
        <div className="flex flex-row justify-center gap-4 md:gap-6 flex-wrap md:flex-nowrap">
          {/* Column 1 */}
          <Marquee vertical className="flex-1 max-w-sm [--duration:40s]">
            {testimonials.slice(0, 4).map((card, idx) => (
              <motion.div key={idx} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: Math.random() * 0.8, duration: 1.2 }}>
                <TestimonialCard {...card} />
              </motion.div>
            ))}
          </Marquee>
          {/* Column 2 */}
          <Marquee vertical className="flex-1 max-w-sm hidden md:flex [--duration:50s]">
            {testimonials.slice(4, 7).map((card, idx) => (
              <motion.div key={idx} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: Math.random() * 0.8, duration: 1.2 }}>
                <TestimonialCard {...card} />
              </motion.div>
            ))}
          </Marquee>
          {/* Column 3 */}
          <Marquee vertical className="flex-1 max-w-sm hidden lg:flex [--duration:45s]">
            {testimonials.slice(7, 10).map((card, idx) => (
              <motion.div key={idx} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: Math.random() * 0.8, duration: 1.2 }}>
                <TestimonialCard {...card} />
              </motion.div>
            ))}
          </Marquee>
        </div>
        <div className="from-background pointer-events-none absolute inset-x-0 bottom-0 h-1/4 w-full bg-gradient-to-t from-20%"></div>
        <div className="from-background pointer-events-none absolute inset-x-0 top-0 h-1/4 w-full bg-gradient-to-b from-20%"></div>
      </div>
    </section>
  );
}
