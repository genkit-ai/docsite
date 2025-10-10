# SEO Improvement Strategy for genkit.dev

**Date:** October 5, 2025  
**Status:** Ready for Implementation  
**Priority:** Critical - Address Domain Authority Migration Issues  

## Executive Summary

Based on comprehensive investigation, the indexing issues are primarily caused by **domain authority migration challenges** from `firebase.google.com/docs/genkit` to `genkit.dev`. Google Search Console shows 156 pages not indexed, with 144 pages in "Crawled - currently not indexed" status, indicating Google can access content but chooses not to index due to perceived low authority/quality signals.

## Root Cause Analysis

### Primary Issue: Domain Authority Migration
- **Before:** `firebase.google.com` had massive domain authority
- **After:** `genkit.dev` is a new domain with zero established authority
- **Result:** Google hesitant to index content on unproven domain

### Technical SEO Issues (Secondary)
1. **"Duplicate without user-selected canonical" (1 page)** - Missing canonical tags
2. **"Page with redirect" (2 pages)** - Redirect configuration issues  
3. **"Excluded by 'noindex' tag" (9 pages)** - Pages explicitly blocked
4. **"Crawled - currently not indexed" (144 pages)** - Authority/quality signals

## Comprehensive Implementation Strategy

### Phase 1: Technical SEO Fixes (Week 1-2) 🚨 CRITICAL

#### 1.1 Canonical Tags Implementation
**Problem:** Missing canonical tags causing duplicate content signals
**Solution:** Add canonical tags to all documentation pages

```astro
<!-- Add to src/content/custom/head.astro -->
<link rel="canonical" href={Astro.url.href} />
```

**Implementation:**
```astro
---
// In head.astro, add canonical URL logic
const canonicalURL = new URL(Astro.url.pathname, Astro.site);
// Remove language parameters for canonical to avoid duplication
canonicalURL.searchParams.delete('lang');
---

<link rel="canonical" href={canonicalURL.href} />
```

#### 1.2 Meta Robots Optimization
**Problem:** 9 pages excluded by 'noindex' tag
**Solution:** Review and fix noindex directives

```astro
<!-- Ensure proper indexing for documentation pages -->
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
```

#### 1.3 Structured Data Implementation
**Problem:** Google lacks context about content type and structure
**Solution:** Add JSON-LD structured data for documentation

```astro
<!-- Add to head.astro -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "headline": "{page.data.title}",
  "description": "{page.data.description}",
  "author": {
    "@type": "Organization",
    "name": "Google",
    "url": "https://google.com"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Google",
    "logo": {
      "@type": "ImageObject",
      "url": "https://genkit.dev/genkit_logo.png"
    }
  },
  "datePublished": "{page.data.datePublished || '2024-01-01'}",
  "dateModified": "{new Date().toISOString()}",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "{Astro.url.href}"
  }
}
</script>
```

#### 1.4 Hreflang Tags for Language Variants
**Problem:** No language signals for multilingual content
**Solution:** Implement hreflang tags

```astro
<!-- Add language alternatives -->
<link rel="alternate" hreflang="en" href="{baseURL}" />
<link rel="alternate" hreflang="en-js" href="{baseURL}" />
<link rel="alternate" hreflang="en-go" href="{baseURL}?lang=go" />
<link rel="alternate" hreflang="en-python" href="{baseURL}?lang=python" />
<link rel="alternate" hreflang="x-default" href="{baseURL}" />
```

### Phase 2: Authority Building (Week 3-8) 📈 HIGH PRIORITY

#### 2.1 Internal Linking Strategy
**Problem:** Poor internal link distribution and page authority flow
**Solutions:**

1. **Add contextual cross-references:**
```markdown
<!-- In documentation pages -->
For more information about flows, see [Genkit Flows](../flows/).
Learn about [model integration](../models/) before implementing flows.
```

2. **Create topic clusters:**
- Link related integration pages together
- Connect framework guides to core concepts
- Add "Related Articles" sections

3. **Implement breadcrumb navigation:**
```astro
<!-- Add to page templates -->
<nav aria-label="Breadcrumb">
  <ol itemscope itemtype="https://schema.org/BreadcrumbList">
    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
      <a itemprop="item" href="/docs/"><span itemprop="name">Documentation</span></a>
      <meta itemprop="position" content="1" />
    </li>
    <!-- Additional breadcrumb items -->
  </ol>
</nav>
```

#### 2.2 Content Quality Signals
**Problem:** Google perceives content as low-value due to new domain
**Solutions:**

1. **Add publication metadata:**
```astro
<!-- In frontmatter -->
---
title: "Page Title"
description: "Page description"
datePublished: "2024-01-01"
lastModified: "2024-10-05"
author: "Google Genkit Team"
---
```

2. **Implement author attribution:**
```astro
<div class="author-info">
  <span>By Google Genkit Team</span>
  <time datetime="{lastModified}">Last updated: {formatDate(lastModified)}</time>
</div>
```

3. **Add user engagement elements:**
- Feedback buttons ("Was this helpful?")
- Table of contents for long pages
- Estimated reading time
- Related articles suggestions

#### 2.3 Technical Performance Optimization
**Problem:** Core Web Vitals may impact indexing priority
**Solutions:**

1. **Image optimization:**
```astro
<!-- Use Astro's Image component -->
import { Image } from 'astro:assets';
<Image src={imageSrc} alt="Description" width={800} height={400} loading="lazy" />
```

2. **Font loading optimization:**
```html
<!-- Preload critical fonts -->
<link rel="preload" href="/fonts/GoogleSans-Regular.woff2" as="font" type="font/woff2" crossorigin>
```

3. **JavaScript optimization:**
- Minimize bundle sizes
- Use dynamic imports for non-critical code
- Implement proper caching headers

### Phase 3: External Authority Building (Month 2-6) 🌐 MEDIUM PRIORITY

#### 3.1 Link Building Strategy
1. **Developer community outreach:**
   - Submit to developer newsletters
   - Engage with AI/ML communities
   - Participate in relevant forums (Reddit, Stack Overflow)

2. **Content marketing:**
   - Create shareable tutorials and guides
   - Develop interactive examples and demos
   - Build relationships with tech bloggers

3. **Social signals:**
   - Promote content on Twitter, LinkedIn
   - Encourage community sharing
   - Create video content for YouTube

#### 3.2 Content Freshness Strategy
1. **Regular content updates:**
   - Add new integration guides monthly
   - Update existing documentation with new features
   - Create changelog and release notes

2. **Community engagement:**
   - Respond to GitHub issues and discussions
   - Create FAQ sections based on common questions
   - Add community-contributed examples

### Phase 4: Monitoring and Optimization (Ongoing) 📊

#### 4.1 Google Search Console Monitoring
**Weekly Tracking:**
- "Crawled - currently not indexed" status changes
- Total indexed pages progression
- New technical issues detection
- Click-through rates and impressions

**Monthly Analysis:**
- Keyword ranking improvements
- Organic traffic growth
- User engagement metrics
- Domain authority progression

#### 4.2 Performance Metrics
**Key Success Indicators:**
- Indexed pages: Target 50+ pages within 3 months
- Organic traffic: 200% increase within 6 months
- Average position: Top 10 for primary keywords
- Domain authority: Measurable growth within 6 months

## Implementation Timeline

### Week 1-2: Technical Foundation
- [ ] Add canonical tags to all pages
- [ ] Fix noindex issues on 9 excluded pages
- [ ] Implement basic structured data markup
- [ ] Resolve redirect issues on 2 affected pages
- [ ] Add hreflang tags for language variants

### Week 3-4: Content Enhancement
- [ ] Implement internal linking strategy
- [ ] Add publication dates and author attribution
- [ ] Create breadcrumb navigation
- [ ] Optimize meta descriptions and titles

### Month 2: Authority Building
- [ ] Launch content marketing initiatives
- [ ] Begin external link building campaigns
- [ ] Implement user engagement features
- [ ] Start social media promotion

### Month 3-6: Scale and Optimize
- [ ] Monitor and adjust based on GSC data
- [ ] Expand content freshness initiatives
- [ ] Build community engagement programs
- [ ] Measure and report on success metrics

## Expected Results Timeline

- **Week 2:** Technical fixes implemented and deployed
- **Week 4:** Google begins re-crawling with improvements
- **Month 2:** First significant indexing improvements visible
- **Month 3:** 25+ pages indexed (from current 1)
- **Month 6:** 50+ pages indexed with improved rankings
- **Month 12:** Full domain authority establishment

## Risk Mitigation

### Potential Challenges
1. **Slow domain authority building:** New domains take 6-12 months to establish authority
2. **Google algorithm changes:** Stay updated with SEO best practices
3. **Competition:** Other documentation sites may have established authority

### Mitigation Strategies
1. **Consistent implementation:** Follow the strategy systematically
2. **Quality over quantity:** Focus on high-quality content and technical excellence
3. **Community building:** Leverage Google's brand authority through community engagement
4. **Patience and persistence:** Domain authority building is a long-term process

## Success Metrics

### Primary KPIs
- **Indexed Pages:** From 1 to 50+ within 6 months
- **Organic Traffic:** 200% increase within 6 months
- **Search Visibility:** Top 10 rankings for primary keywords
- **Domain Authority:** Measurable growth in authority metrics

### Secondary KPIs
- **User Engagement:** Increased time on page and reduced bounce rate
- **Community Growth:** More GitHub stars, Discord members
- **Content Performance:** Higher click-through rates from search
- **Technical Performance:** Improved Core Web Vitals scores

## Conclusion

The SEO improvement strategy addresses both immediate technical issues and long-term authority building needs. Success requires consistent implementation across all phases, with particular focus on the critical technical fixes in Phase 1 and sustained authority building efforts in subsequent phases.

The combination of technical excellence, quality content signals, and community engagement should result in significant indexing improvements within 3-6 months, with full domain authority establishment expected within 12 months.