#!/usr/bin/env python3
"""E2E auth suite against local dev server: login / me / forgot / reset / signup / logout."""
import json, urllib.request, urllib.parse, http.cookiejar, time, os

BASE = os.environ.get("BASE", "http://localhost:3000")
ADMIN_ID = os.environ.get("ADMIN_ID", "admin")
ADMIN_PW = os.environ.get("ADMIN_PW", "ChangeMe@123")
MEMBER_ID = os.environ.get("MEMBER_ID", "member")
MEMBER_PW = os.environ.get("MEMBER_PW", "ChangeMe@123")
jar = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))

def req(method, path, body=None, base=BASE):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(base + path, data=data, method=method,
                               headers={"Content-Type": "application/json"})
    try:
        with opener.open(r, timeout=30) as res:
            return res.status, res.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()
    except Exception as e:
        return 0, str(e)

results = []
def check(name, st, body, want, want_text=None):
    ok = st == want and (want_text is None or want_text in body)
    results.append(ok)
    print(f"{'PASS' if ok else 'FAIL'} [{st}] {name} :: {body[:140]}")

# 1. admin login
st, b = req("POST", "/api/auth/login", {"id": ADMIN_ID, "password": ADMIN_PW, "role": "admin"})
check("login admin", st, b, 200, '"role":"admin"')

# 2. session me
st, b = req("GET", "/api/auth/me")
check("me (admin session)", st, b, 200, '"username":"' + ADMIN_ID + '"')

# 3. logout
st, b = req("POST", "/api/auth/logout")
check("logout", st, b, 200)

# 4. member login (demo member)
st, b = req("POST", "/api/auth/login", {"id": MEMBER_ID, "password": MEMBER_PW})
check("login member", st, b, 200, '"username":"' + MEMBER_ID + '"')
st, b = req("POST", "/api/auth/logout")

# 5. wrong password
st, b = req("POST", "/api/auth/login", {"id": ADMIN_ID, "password": "wrongpass"})
check("login wrong pw -> 401", st, b, 401, "invalid_credentials")

# 6. forgot password for admin email (SMTP unset -> reset_url fallback)
st, b = req("POST", "/api/auth/forgot", {"email": os.environ.get("ADMIN_EMAIL", "admin@example.org")})
token = None
try:
    j = json.loads(b)
    token = (j.get("reset_url") or "").split("token=")[-1] or j.get("dev_token")
except Exception:
    pass
check("forgot (reset_url fallback)", st, b, 200)

# 7. reset with token -> set SAME password (no effective change) then login again
if token:
    st, b = req("POST", "/api/auth/reset", {"token": token, "password": ADMIN_PW})
    check("reset pw (same value)", st, b, 200)
    st, b = req("POST", "/api/auth/login", {"id": ADMIN_ID, "password": ADMIN_PW, "role": "admin"})
    check("login after reset", st, b, 200, '"role":"admin"')
    st, b = req("POST", "/api/auth/reset", {"token": token, "password": ADMIN_PW})
    check("token burned -> 400", st, b, 400)
else:
    results.append(False)
    print("FAIL forgot did not return token — cannot test reset cycle")

# 8. signup fresh user (then login as them)
uname = f"diag{int(time.time()) % 100000}"
st, b = req("POST", "/api/auth/signup", {
    "username": uname, "full_name": "Diag Tester", "email": f"{uname}@rcyrpi.org",
    "phone": f"017{int(time.time()) % 100000000:08d}", "password": "diagpass123",
    "blood_group": "O+", "agree_terms": True,
    "address": {"district": "Rangpur", "upazila": "Rangpur Sadar", "thana": "Rangpur Sadar", "ward": "ward", "para": "para"},
})
check("signup fresh user", st, b, 201)
st, b = req("POST", "/api/auth/logout")
st, b = req("POST", "/api/auth/login", {"id": uname, "password": "diagpass123"})
check("login fresh user", st, b, 200, '"role":"member"')
st, b = req("POST", "/api/auth/logout")

print(f"\n=== AUTH SUITE: {sum(results)}/{len(results)} passed ===")
print(f"created_user_to_cleanup={uname}")
