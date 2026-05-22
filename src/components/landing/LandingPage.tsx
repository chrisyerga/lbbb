'use client'

import { LandingLayout } from './LandingLayout'
import { LandingDemo } from './sections/LandingDemo'
import { LandingExample } from './sections/LandingExample'
import { LandingFAQ } from './sections/LandingFAQ'
import { LandingFooter } from './sections/LandingFooter'
import { LandingHero } from './sections/LandingHero'
import { LandingHow } from './sections/LandingHow'
import { LandingMarquee } from './sections/LandingMarquee'
import { LandingNav } from './sections/LandingNav'
import { LandingPricing } from './sections/LandingPricing'
import { LandingSocial } from './sections/LandingSocial'
import { LandingTestimonials } from './sections/LandingTestimonials'

export function LandingPage() {
  return (
    <LandingLayout>
      <LandingNav />
      <LandingHero />
      <LandingMarquee />
      <LandingHow />
      <LandingDemo />
      <LandingExample />
      <LandingSocial />
      <LandingPricing />
      <LandingTestimonials />
      <LandingFAQ />
      <LandingFooter />
    </LandingLayout>
  )
}
