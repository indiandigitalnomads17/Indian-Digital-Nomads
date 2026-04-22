'use client';

import React, { useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const defaultTestimonials = [
  {
    text: 'MVPBlocks has completely changed the way I build UIs. Copy-paste, done. No more design stress.',
    imageSrc: 'https://i.pravatar.cc',
    name: 'Arjun Mehta',
    username: '@arjdev',
    role: 'Frontend Developer',
  },
  {
    text: 'Honestly shocked at how smooth the animations and styling are out of the box. Just works.',
    imageSrc: 'https://i.pravatar.cc',
    name: 'Sara Lin',
    username: '@sara.codes',
    role: 'UX Designer',
  },
  {
    text: 'Our team launched a client site in 2 days using MVPBlocks. Saved so much time.',
    imageSrc: 'https://i.pravatar.cc',
    name: 'Devon Carter',
    username: '@devninja',
    role: 'Product Manager',
  },
  {
    text: 'Plugged a few blocks into our existing codebase and everything blended perfectly. Massive W.',
    imageSrc: 'https://i.pravatar.cc',
    name: 'Priya Shah',
    username: '@priyacodes',
    role: 'Full Stack Developer',
  },
  {
    text: 'Found a beautiful hero section, dropped it into V0, tweaked copy, and shipped in 15 minutes.',
    imageSrc: 'https://i.pravatar.cc',
    name: 'Leo Martin',
    username: '@leobuilds',
    role: 'Startup Founder',
  },
  {
    text: 'MVPBlocks helped us prototype multiple landing pages without writing CSS once.',
    imageSrc: 'https://i.pravatar.cc',
    name: 'Chloe Winters',
    username: '@chloewinters',
    role: 'UI Designer',
  },
];

interface TestimonialProps {
  testimonials?: {
    text: string;
    imageSrc: string;
    name: string;
    username: string;
    role?: string;
  }[];
  title?: string;
  subtitle?: string;
  autoplaySpeed?: number;
  className?: string;
}

export default function TestimonialsCarousel({
  testimonials = defaultTestimonials,
  title = 'What our users say',
  subtitle = 'From intuitive design to powerful features, our components have become essential tools for developers around the world.',
  autoplaySpeed = 3000,
  className,
}: TestimonialProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'center',
    containScroll: 'trimSnaps',
    dragFree: false,
  });

  useEffect(() => {
    if (!emblaApi) return;

    let intervalId: NodeJS.Timeout;

    const startAutoplay = () => {
      intervalId = setInterval(() => {
        if (emblaApi.canScrollNext()) {
          emblaApi.scrollNext();
        }
      }, autoplaySpeed);
    };

    const stopAutoplay = () => {
      clearInterval(intervalId);
    };

    emblaApi.on('pointerDown', stopAutoplay);
    emblaApi.on('settle', startAutoplay);

    startAutoplay();

    return () => {
      stopAutoplay();
      emblaApi.off('pointerDown', stopAutoplay);
      emblaApi.off('settle', startAutoplay);
    };
  }, [emblaApi, autoplaySpeed]);

  const allTestimonials = testimonials;

  return (
    <section
      className={cn('relative overflow-hidden py-16 md:py-24', className)}
    >
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.1),transparent_60%)]" />
        <div className="bg-[#2563EB]/5 absolute top-1/4 left-1/4 h-32 w-32 rounded-full blur-3xl" />
        <div className="bg-[#10b981]/10 absolute right-1/4 bottom-1/4 h-40 w-40 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="relative mb-12 text-center md:mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight text-[#0B1C30] mb-4">
            {title}
          </h2>

          <motion.p
            className="text-[#64748B] mx-auto max-w-2xl text-base md:text-lg"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            {subtitle}
          </motion.p>
        </motion.div>

        {/* Testimonials carousel */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex -ml-4">
            {allTestimonials.map((testimonial, index) => (
              <div
                key={`${testimonial.name}-${index}`}
                className="flex-[0_0_100%] min-w-0 pl-4 md:flex-[0_0_50%] lg:flex-[0_0_33.333%]"
              >
                <div className="h-full px-2">
                  <div className="relative h-full w-full rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-md backdrop-blur-sm transition-transform duration-300 hover:scale-[1.02]">
                    {/* Enhanced decorative gradients */}
                    <div className="from-[#2563EB]/10 to-white absolute -top-5 -left-5 -z-10 h-40 w-40 rounded-full bg-gradient-to-b blur-md" />
                    <div className="from-[#10b981]/10 absolute -right-10 -bottom-10 -z-10 h-32 w-32 rounded-full bg-gradient-to-t to-transparent opacity-70 blur-xl" />

                    <div className="text-[#2563EB] mb-4">
                      <div className="relative">
                        <Quote className="h-10 w-10 -rotate-180" />
                      </div>
                    </div>

                    <p className="text-[#0B1C30] relative mb-6 text-base leading-relaxed line-clamp-4">
                      <span className="relative">{testimonial.text}</span>
                    </p>

                    {/* Enhanced user info */}
                    <div className="border-[#e2e8f0] mt-auto flex items-center gap-3 border-t pt-4">
                      <Avatar className="border-[#e2e8f0] ring-[#2563EB]/10 ring-offset-white h-10 w-10 border ring-2 ring-offset-1">
                        <AvatarImage
                          src={testimonial.imageSrc}
                          alt={testimonial.name}
                        />
                        <AvatarFallback>
                          {testimonial.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <h4 className="text-[#0B1C30] font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                          {testimonial.name}
                        </h4>
                        <div className="flex items-center gap-2 overflow-hidden">
                          <p className="text-[#64748B] text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                            {testimonial.username}
                          </p>
                          {testimonial.role && (
                            <>
                              <span className="text-[#94a3b8] flex-shrink-0">
                                •
                              </span>
                              <p className="text-[#64748B] text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                                {testimonial.role}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
