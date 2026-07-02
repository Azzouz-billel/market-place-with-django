from django.contrib import admin, messages

from .models import Campaign, NewsletterSubscriber
from .services import send_campaign


@admin.register(NewsletterSubscriber)
class NewsletterSubscriberAdmin(admin.ModelAdmin):
    list_display = ["email", "is_active", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["email"]


@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = ["subject", "created_at", "sent_at"]
    actions = ["send_now"]

    @admin.action(description="Send to all active subscribers")
    def send_now(self, request, queryset):
        total = sum(send_campaign(campaign) for campaign in queryset)
        self.message_user(
            request,
            f"Sent {queryset.count()} campaign(s) to {total} subscriber(s).",
            messages.SUCCESS,
        )
