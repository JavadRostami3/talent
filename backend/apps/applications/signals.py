"""
Signals for automatic file cleanup when models are deleted or updated
"""
import os
from django.db.models.signals import pre_delete, pre_save
from django.dispatch import receiver
from apps.documents.models import ApplicationDocument
from apps.applications.models import OlympiadRecord, LanguageCertificate, ResearchArticle, Patent, Book, MastersThesis


def delete_file_if_exists(file_field):
    """حذف فایل از دیسک در صورت وجود"""
    if file_field and os.path.isfile(file_field.path):
        try:
            os.remove(file_field.path)
        except Exception as e:
            # Log the error but don't raise exception
            print(f"Error deleting file: {e}")


@receiver(pre_delete, sender=ApplicationDocument)
def auto_delete_document_on_delete(sender, instance, **kwargs):
    """حذف خودکار فایل هنگام حذف مدرک"""
    delete_file_if_exists(instance.file)


@receiver(pre_save, sender=ApplicationDocument)
def auto_delete_document_on_change(sender, instance, **kwargs):
    """حذف فایل قدیمی هنگام آپلود فایل جدید"""
    if not instance.pk:
        return False
    
    try:
        old_file = sender.objects.get(pk=instance.pk).file
    except sender.DoesNotExist:
        return False
    
    new_file = instance.file
    if old_file and old_file != new_file:
        delete_file_if_exists(old_file)


@receiver(pre_delete, sender=OlympiadRecord)
def auto_delete_olympiad_file_on_delete(sender, instance, **kwargs):
    """حذف خودکار فایل المپیاد"""
    delete_file_if_exists(instance.certificate_file)


@receiver(pre_save, sender=OlympiadRecord)
def auto_delete_olympiad_file_on_change(sender, instance, **kwargs):
    """حذف فایل قدیمی المپیاد"""
    if not instance.pk:
        return False
    
    try:
        old_file = sender.objects.get(pk=instance.pk).certificate_file
    except sender.DoesNotExist:
        return False
    
    new_file = instance.certificate_file
    if old_file and old_file != new_file:
        delete_file_if_exists(old_file)


@receiver(pre_delete, sender=LanguageCertificate)
def auto_delete_language_file_on_delete(sender, instance, **kwargs):
    """حذف خودکار فایل مدرک زبان"""
    delete_file_if_exists(instance.certificate_file)


@receiver(pre_save, sender=LanguageCertificate)
def auto_delete_language_file_on_change(sender, instance, **kwargs):
    """حذف فایل قدیمی مدرک زبان"""
    if not instance.pk:
        return False
    
    try:
        old_file = sender.objects.get(pk=instance.pk).certificate_file
    except sender.DoesNotExist:
        return False
    
    new_file = instance.certificate_file
    if old_file and old_file != new_file:
        delete_file_if_exists(old_file)


@receiver(pre_delete, sender=ResearchArticle)
def auto_delete_research_file_on_delete(sender, instance, **kwargs):
    """حذف خودکار فایل مقاله پژوهشی"""
    delete_file_if_exists(instance.file)


@receiver(pre_delete, sender=Patent)
def auto_delete_patent_file_on_delete(sender, instance, **kwargs):
    """حذف خودکار فایل اختراع"""
    delete_file_if_exists(instance.file)


@receiver(pre_delete, sender=Book)
def auto_delete_book_file_on_delete(sender, instance, **kwargs):
    """حذف خودکار فایل کتاب"""
    delete_file_if_exists(instance.file)


@receiver(pre_delete, sender=MastersThesis)
def auto_delete_thesis_file_on_delete(sender, instance, **kwargs):
    """حذف خودکار فایل پایان‌نامه"""
    delete_file_if_exists(instance.defense_minutes_file)
