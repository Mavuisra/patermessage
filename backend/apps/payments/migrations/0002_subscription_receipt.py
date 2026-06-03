from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("payments", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="paymentrecord",
            name="period_end",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="paymentrecord",
            name="period_start",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="paymentrecord",
            name="receipt_number",
            field=models.CharField(blank=True, max_length=32, null=True, unique=True),
        ),
        migrations.AddField(
            model_name="paymentrecord",
            name="receipt_pdf",
            field=models.FileField(blank=True, null=True, upload_to="receipts/%Y/%m/"),
        ),
        migrations.AlterField(
            model_name="paymentrecord",
            name="currency",
            field=models.CharField(default="usd", max_length=3),
        ),
        migrations.AlterField(
            model_name="paymentrecord",
            name="kind",
            field=models.CharField(
                choices=[
                    ("subscription", "Abonnement mensuel"),
                    ("premium_message", "Message premium"),
                    ("call_booking", "Réservation appel"),
                ],
                max_length=30,
            ),
        ),
    ]
