// فایل کمکی برای رفع خطاهای TypeScript در ResearchRecordsStep
// این فایل حاوی راهنمای اصلاح تمام خطاهای errors.property است

/* 
راه حل: استفاده از (errors as any) برای دسترسی به property های discriminated union

جایگزین کنید:
{errors.property_name && <p className="text-sm text-red-600">{errors.property_name.message}</p>}

با:
{(errors as any).property_name && <p className="text-sm text-red-600">{String((errors as any).property_name.message || '')}</p>}

لیست property هایی که باید تصحیح شوند:
- title_fa
- title_en  
- article_type
- journal_name
- publish_year
- authors
- patent_number
- registration_date
- inventors
- book_type
- publisher
- authors_or_translators
- conference_name
- conference_type
- year
- festival_name
- award_title
- grade
- defense_date
- main_supervisor
- second_supervisor
- advisor_1
- advisor_2
*/
