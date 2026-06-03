"""Tests E2E API — exécution locale."""
import json
import urllib.request
import urllib.error

BASE = "http://127.0.0.1:8000/api"
PROXY = "http://127.0.0.1:5173/api"

results = []


def req(url, method="GET", data=None, headers=None):
    h = {"Content-Type": "application/json", **(headers or {})}
    body = json.dumps(data).encode() if data else None
    r = urllib.request.Request(url, data=body, headers=h, method=method)
    try:
        with urllib.request.urlopen(r, timeout=60) as res:
            return res.status, json.loads(res.read().decode()) if res.length else {}
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw)
        except json.JSONDecodeError:
            return e.code, {"raw": raw}


def ok(name, cond, detail=""):
    results.append((name, cond, detail))
    sym = "OK" if cond else "FAIL"
    print(f"  [{sym}] {name}" + (f" — {detail}" if detail and not cond else ""))


print("\n=== API Django (direct) ===\n")

code, profile = req(f"{BASE}/public/")
ok("GET /public/", code == 200, f"code={code}")
ok("Profil display_name", profile.get("display_name") == "Black Pater")

code, login = req(
    f"{BASE}/auth/login/",
    "POST",
    {"username": "admin", "password": "Admin@2026"},
)
ok("Login owner", code == 200 and "access" in login)
token = login.get("access", "")

code, free = req(
    f"{BASE}/messages/submit/",
    "POST",
    {
        "sender_name": "Test User",
        "sender_email": "test@example.com",
        "subject": "",
        "body": "Message gratuit test E2E",
        "tier": "free",
    },
)
ok("Message gratuit", code == 201, f"code={code}")
free_id = free.get("message", {}).get("id")

code, thread = req(f"{BASE}/messages/thread/?email=test@example.com")
ok("Fil visiteur GET /thread/", code == 200 and isinstance(thread.get("items"), list))
ok(
    "Fil contient message gratuit",
    any(i.get("kind") == "visitor" and i.get("id") == free_id for i in thread.get("items", [])),
)

code, premium = req(
    f"{BASE}/messages/submit/",
    "POST",
    {
        "sender_name": "Test Premium",
        "sender_email": "premium@example.com",
        "subject": "",
        "body": "Message prioritaire test",
        "tier": "premium",
    },
)
ok("Message premium (création)", code == 201)
premium_id = premium.get("message", {}).get("id")

code, _ = req(
    f"{BASE}/payments/mock-confirm/",
    "POST",
    {"message_id": premium_id},
)
ok("Mock confirm premium", code in (200, 201))

code, vreg = req(
    f"{BASE}/auth/visitor/register/",
    "POST",
    {
        "email": "visitor@test.com",
        "password": "testpass123",
        "name": "Visiteur Test",
        "occupation": "testeur",
    },
)
ok("Inscription visiteur", code == 201 and "access" in vreg)
vtoken = vreg.get("access", "")

code, vlogin = req(
    f"{BASE}/auth/visitor/login/",
    "POST",
    {"email": "visitor@test.com", "password": "testpass123"},
)
ok("Connexion visiteur email+mdp", code == 200 and "access" in vlogin)

code, my_pay = req(f"{BASE}/payments/my/?email=premium@example.com")
ok("Paiements visiteur GET /my/", code == 200 and isinstance(my_pay.get("items"), list))

code, slots = req(f"{BASE}/bookings/slots/")
ok("Créneaux disponibles", code == 200 and isinstance(slots, list))
slot_id = slots[0]["id"] if slots else None

if slot_id:
    code, book = req(
        f"{BASE}/bookings/book/",
        "POST",
        {
            "slot_id": slot_id,
            "guest_name": "Guest Test",
            "guest_email": "guest@example.com",
            "topic": "Partenariat",
            "notes": "",
        },
    )
    ok("Réservation appel", code == 201)
    booking_id = book.get("booking", {}).get("id")
    if booking_id:
        code, _ = req(
            f"{BASE}/payments/mock-confirm/",
            "POST",
            {"booking_id": booking_id},
        )
        ok("Mock confirm booking", code in (200, 201))

if token:
    code, msgs = req(f"{BASE}/messages/", headers={"Authorization": f"Bearer {token}"})
    ok("Liste messages owner", code == 200)
    msg_id = None
    if isinstance(msgs, dict) and msgs.get("results"):
        msg_id = msgs["results"][0]["id"]
    elif isinstance(msgs, list) and msgs:
        msg_id = msgs[0]["id"]
    if msg_id:
        code, reply = req(
            f"{BASE}/messages/{msg_id}/reply/",
            "POST",
            {"body": "Réponse test E2E Black Pater"},
            headers={"Authorization": f"Bearer {token}"},
        )
        ok("Réponse owner POST /reply/", code == 201, f"code={code}")
        ok("Corps réponse", reply.get("body") == "Réponse test E2E Black Pater")
    code, stats = req(f"{BASE}/analytics/dashboard/", headers={"Authorization": f"Bearer {token}"})
    ok("Stats dashboard", code == 200)

print("\n=== API via proxy Vite ===\n")
code, _ = req(f"{PROXY}/public/")
ok("Proxy /api/public/", code == 200, f"code={code}")

print("\n=== Pages frontend (HTML) ===\n")
routes = [
    ("/", "wa-splash"),
    ("/login", "wa-login"),
    ("/messages", "wa-screen"),
    ("/chat", "wa-chat"),
    ("/payment/methods", "wa-pay-page"),
    ("/payment/success", "wa-success"),
    ("/profile", "wa-tabbar"),
    ("/payments", "wa-screen"),
]

for path, _css in routes:
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:5173{path}", timeout=10) as res:
            html = res.read().decode()
            ok(f"Page {path} (SPA shell)", res.status == 200 and 'id="root"' in html)
    except Exception as e:
        ok(f"Page {path}", False, str(e))

passed = sum(1 for _, c, _ in results if c)
failed = sum(1 for _, c, _ in results if not c)
print(f"\n=== RÉSULTAT: {passed}/{len(results)} tests réussis ===\n")
if failed:
    print("Échecs:")
    for name, c, d in results:
        if not c:
            print(f"  - {name}: {d}")
    exit(1)
exit(0)
