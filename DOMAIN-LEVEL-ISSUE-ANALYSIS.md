# Domain-Level Issue Analysis - genkit.dev

**Date:** October 7, 2025  
**Critical Discovery:** Multiple genkit.dev subdomains launched before main site also not indexed  
**Status:** MAJOR ROOT CAUSE REVISION REQUIRED  

## Critical Evidence

### Timeline and Pattern
1. **examples.genkit.dev** - Launched BEFORE genkit.dev, never indexed
2. **fiddle.genkit.dev** - Launched BEFORE genkit.dev, never indexed  
3. **genkit.dev** - Launched later, only homepage and get-started indexed

### Google Search Console Data for examples.genkit.dev
- **Status:** "Page is not indexed: Crawled - currently not indexed"
- **Last crawl:** Oct 5, 2025, 12:36:57 PM
- **Crawled as:** Googlebot smartphone
- **Crawl allowed:** Yes
- **Page fetch:** Successful
- **Indexing allowed:** Yes
- **User-declared canonical:** None
- **Google-selected canonical:** Inspected URL

### Key Insight: This is NOT Domain Authority Migration
The fact that subdomains launched BEFORE the main site migration also cannot get indexed proves this is **NOT** about authority transfer from firebase.google.com.

## Revised Root Cause Analysis

### Domain-Level Issues (Most Likely)

#### 1. Google Manual Action or Penalty
**Possibility:** The genkit.dev domain may have a manual action or algorithmic penalty

**Evidence:**
- Multiple subdomains across different timeframes affected
- Technical crawling works (successful page fetch)
- Content quality varies but all affected equally
- Pattern consistent across entire domain family

**Investigation Required:**
- Check Google Search Console for manual actions
- Review domain history and previous ownership
- Analyze any potential policy violations

#### 2. Domain Reputation Issues
**Possibility:** The genkit.dev domain may have reputation problems

**Potential Causes:**
- Previous domain ownership issues
- Spam associations in domain history
- Geographic or registrar-related trust issues
- Domain age and establishment period

#### 3. Technical Configuration Issues
**Possibility:** Domain-level technical problems affecting entire genkit.dev family

**Potential Issues:**
- DNS configuration problems
- SSL/TLS certificate issues
- Server response patterns
- Hosting infrastructure problems
- CDN or proxy configuration issues

#### 4. Content Policy Violations
**Possibility:** Google perceives genkit.dev content as violating quality guidelines

**Potential Issues:**
- AI-generated content detection (ironic for an AI framework)
- Thin content signals across subdomains
- Duplicate content patterns across the domain family
- Technical documentation perceived as low-value

## Evidence Analysis

### What Works (Proves Technical Setup is Sound)
- ✅ Google can crawl all pages successfully
- ✅ Page fetch is successful
- ✅ Indexing is technically allowed
- ✅ No robots.txt blocking
- ✅ Sitemaps are properly generated

### What Doesn't Work (Consistent Pattern)
- ❌ examples.genkit.dev - Never indexed (launched first)
- ❌ fiddle.genkit.dev - Never indexed (launched first)  
- ❌ genkit.dev/docs/* - Not indexed (launched later)
- ✅ genkit.dev/ - Indexed (homepage only)
- ✅ genkit.dev/docs/get-started/ - Indexed (exception)

### Pattern Analysis
The fact that only the homepage and one documentation page are indexed suggests:
1. **Domain is not completely blocked** (some pages can be indexed)
2. **Quality threshold is extremely high** for this domain
3. **Google is selectively indexing** only the most valuable content
4. **Authority/trust signals are severely lacking** across the entire domain

## Immediate Investigation Required

### 1. Manual Actions Check
```bash
# Check Google Search Console for:
# - Manual actions against the domain
# - Security issues
# - Policy violations
# - Spam reports
```

### 2. Domain History Analysis
```bash
# Research:
# - Previous ownership of genkit.dev
# - Domain registration date and history
# - Any previous content or usage
# - Wayback Machine analysis
```

### 3. Technical Deep Dive
```bash
# Analyze:
# - DNS configuration across all subdomains
# - SSL certificate setup and trust
# - Server response headers
# - CDN/proxy configuration
# - Geographic routing issues
```

### 4. Content Quality Assessment
```bash
# Review:
# - Content uniqueness across subdomains
# - AI-generated content detection
# - Technical documentation quality signals
# - User engagement metrics
```

## Revised Strategy Implications

### Firebase Authority Transfer Strategy - Still Valid But Insufficient
- **Still implement:** Firebase linking will help but won't solve domain-level issues
- **Reduced expectations:** May not see dramatic improvements if domain has fundamental problems
- **Complementary approach:** Use Firebase authority to help overcome domain reputation issues

### Domain-Level Solutions Required

#### 1. Identify and Resolve Root Cause
- **Manual actions:** Request review if found
- **Technical issues:** Fix DNS, SSL, server configuration problems
- **Content quality:** Improve signals across all subdomains
- **Domain reputation:** Build trust signals systematically

#### 2. Enhanced Authority Building
- **External validation:** Get high-authority sites to link to genkit.dev
- **Social proof:** Build community engagement and social signals
- **Content excellence:** Ensure all content meets highest quality standards
- **User engagement:** Improve metrics across all subdomains

#### 3. Systematic Domain Rehabilitation
- **Subdomain strategy:** Focus on getting one subdomain fully indexed first
- **Content consolidation:** Consider consolidating content to reduce thin content signals
- **Quality over quantity:** Prioritize exceptional content over comprehensive coverage

## Updated Timeline Expectations

### With Domain-Level Issues
- **Month 1-2:** Identify and address root cause
- **Month 2-4:** Implement domain rehabilitation strategy
- **Month 4-8:** Gradual indexing improvements across subdomains
- **Month 8-12:** Full domain authority establishment

### Critical Success Factors
1. **Root cause identification:** Must find and fix the underlying domain issue
2. **Systematic approach:** Address domain reputation holistically
3. **Quality focus:** Ensure all content exceeds Google's quality thresholds
4. **External validation:** Build trust signals from authoritative sources

## Conclusion

The discovery that examples.genkit.dev and fiddle.genkit.dev (launched before the main site) also cannot get indexed **fundamentally changes our analysis**. This is not primarily a domain authority migration issue - there appears to be a **domain-level problem** affecting the entire genkit.dev family.

**Immediate Priority:**
1. **Investigate domain-level issues** (manual actions, technical problems, reputation)
2. **Maintain Firebase strategy** (still valuable for authority building)
3. **Implement domain rehabilitation** (systematic trust building)
4. **Focus on quality signals** (exceed Google's thresholds)

This explains why the technical infrastructure works perfectly but indexing fails - the domain itself may have trust or reputation issues that need to be addressed at a fundamental level.