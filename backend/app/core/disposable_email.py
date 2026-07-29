"""
Decision Twin AI — Disposable Email Blocker.

Blocks temporary/disposable email addresses from registering.
Uses the community-maintained 'disposable-email-domains' blocklist
(100,000+ domains) downloaded at startup with a hardcoded fallback.

Reference: https://github.com/disposable-email-domains/disposable-email-domains
"""
from __future__ import annotations

import structlog

logger = structlog.get_logger(__name__)

# ── Blocklist Source ──────────────────────────────────────────────────────────
_BLOCKLIST_URL = (
    "https://raw.githubusercontent.com/"
    "disposable-email-domains/disposable-email-domains/"
    "master/disposable_email_blocklist.conf"
)

# ── Hardcoded Fallback ────────────────────────────────────────────────────────
# Used if the remote list is unavailable at startup.
# Covers the most common temp mail services.
_FALLBACK_BLOCKLIST: set[str] = {
    # Classic disposable services
    "mailinator.com", "guerrillamail.com", "guerrillamail.net",
    "guerrillamail.org", "guerrillamail.biz", "guerrillamail.de",
    "tempmail.com", "temp-mail.org", "temp-mail.io",
    "10minutemail.com", "10minutemail.net", "10minutemail.org",
    "throwam.com", "throwam.net", "trashmail.com", "trashmail.net",
    "trashmail.me", "trashmail.at", "trashmail.io", "trashmail.org",
    "yopmail.com", "yopmail.fr", "spam4.me", "sharklasers.com",
    "guerrillamailblock.com", "grr.la", "guerrillamail.info",
    "dispostable.com", "spamgourmet.com", "spamgourmet.net",
    "spamgourmet.org", "maildrop.cc", "fakeinbox.com",
    "mailnull.com", "spam.la", "rejectmail.com", "spamfree.email",
    "owlpic.com", "discard.email", "inboxkitten.com",
    "jetable.fr", "jetable.net", "jetable.org",
    # Random-looking catch-all networks (like your examples)
    "melodyneon.com", "quarkclear.com", "kingcq.com",
    "dnses.ro", "mailtome.de", "nwldx.com",
    # More well-known ones
    "mailnesia.com", "mailnull.com", "spamevader.com",
    "spammotel.com", "spamthisplease.com", "tempinbox.com",
    "temporaryemail.net", "throwaway.email", "wegwerfmail.de",
    "wegwerfmail.net", "wegwerfmail.org", "mt2015.com",
    "mt2016.com", "mt2017.com", "spambog.com", "spambog.de",
    "spambog.ru", "abyssmail.com", "byom.de", "clrmail.com",
    "dacoolest.com", "dandikmail.com", "dayrep.com", "dingbone.com",
    "doanart.com", "dontusethis.com", "dump-email.info",
    "e4ward.com", "easytrashmail.com", "emaildrop.io",
    "emailna.com", "emailondeck.com", "emailsensei.com",
    "emailtemporanea.com", "emailtemporanea.net", "emailwarden.com",
    "fakemailz.com", "filzmail.com", "fleckens.hu",
    "frapmail.com", "fudgerub.com", "getairmail.com",
    "girlsundertheinfluence.com", "gowikibooks.com", "gowikicampus.com",
    "gowikicars.com", "gowikifilms.com", "gowikigames.com",
    "gowikimusic.com", "gowikinetwork.com", "gowikitravel.com",
    "gowikitv.com", "gratismail.us", "greensloth.com",
    "guerrillamail.biz", "h8s.org", "haltospam.com",
    "hatespam.org", "hidemail.de", "hidzz.com",
    "hmamail.com", "hopemail.biz", "ieatspam.eu",
    "ieatspam.info", "iroid.com", "iwi.net",
    "jetable.com", "junk1.tk", "kasmail.com",
    "klassmaster.com", "klassmaster.net", "klzlk.com",
    "kurzepost.de", "letthemeatspam.com", "lhsdv.com",
    "lifebyfood.com", "link2mail.net", "litedrop.com",
    "lol.ovpn.to", "lookugly.com", "lortemail.dk",
    "lr78.com", "lroid.com", "lzh1.com",
    "m4ilweb.info", "maboard.com", "mail-filter.com",
    "mail-temporaire.fr", "mail.mezimages.net",
    "mail333.com", "mailbidon.com", "mailbiz.biz",
    "mailblocks.com", "mailbolt.com", "mailc.net",
    "mailchop.com", "mailde.org", "maileater.com",
    "mailexpire.com", "mailf5.com", "mailfa.tk",
    "mailforspam.com", "mailfree.gq", "mailfs.com",
    "mailguard.me", "mailin8r.com", "mailinater.com",
    "mailme.ir", "mailme24.com", "mailmetrash.com",
    "mailmoat.com", "mailnew.com", "mailnull.com",
    "mailpick.biz", "mailrock.biz", "mailscrap.com",
    "mailshell.com", "mailsiphon.com", "mailslite.com",
    "mailsoul.com", "mailtome.de", "mailtothis.com",
    "mailtrash.net", "mailtv.net", "mailzilla.com",
    "makemetheking.com", "manybrain.com", "mbx.cc",
    "mega.zik.dj", "meltmail.com", "messagebeamer.de",
    "mezimages.net", "mfsa.ru", "moncourrier.fr",
    "monemail.fr.nf", "monmail.fr.nf", "monumentmail.com",
    "msa.minsmail.com", "mt2009.com", "mytrashmail.com",
    "neomailbox.com", "nepwk.com", "nervmich.net",
    "nervtmich.net", "netmails.com", "netmails.net",
    "netzidiot.de", "nichemail.uk", "no-spam.ws",
    "nobulk.com", "noclickemail.com", "nogmailspam.info",
    "nomail.pw", "nomail.xl.cx", "nomail2me.com",
    "nospam.ze.tc", "nospam4.us", "nospamfor.us",
    "nospammail.net", "notmailinator.com", "nowhere.org",
    "nwldx.com", "objectmail.com", "obobbo.com",
    "odaymail.com", "odnorazovoe.ru", "oneoffemail.com",
    "onewaymail.com", "onlatedotcom.info", "online.ms",
    "oopi.org", "opayq.com", "ordinaryamerican.net",
    "otherinbox.com", "ourklips.com", "outlawspam.com",
    "ovpn.to", "owlpic.com", "pancakemail.com",
    "pjjkp.com", "plexolan.de", "pookmail.com",
    "privacy.net", "proxymail.eu", "prtnx.com",
    "punkass.com", "putthisinyourspamdatabase.com", "pwrby.com",
    "quickinbox.com", "rcpt.at", "recode.me",
    "regbypass.comsafe-mail.net", "safetypost.de", "sandelf.de",
    "sd3.in", "selfdestructingmail.com", "send-email.org",
    "sendspamhere.com", "senseless-entertainment.com", "shenobi.ru",
    "shieldedmail.com", "shiftmail.com", "shitmail.me",
    "shitware.nl", "shortmail.net", "sibmail.com",
    "skeefmail.com", "slopsbox.com", "smellfear.com",
    "smwg.info", "soodonims.com", "spam.su",
    "spam4.me", "spamavert.com", "spambob.com",
    "spambob.net", "spambob.org", "spambox.info",
    "spambox.irishspringrealty.com", "spambox.us", "spamcannon.com",
    "spamcannon.net", "spamcero.com", "spamcon.org",
    "spamcorpse.com", "spamdag.com", "spamday.com",
    "spamdecoy.net", "spamex.com", "spamfree24.org",
    "spamfree.eu", "spamgoes.in", "spamherelots.com",
    "spamhereplease.com", "spamhole.com", "spamify.com",
    "spaminator.de", "spamkill.info", "spamme.shutterstock.com",
    "spamoff.de", "spamslicer.com", "spamspot.com",
    "spamthis.co.uk", "spamtroll.net", "spamwc.de",
    "spamwc.net", "spamwc.org", "spoofmail.de",
    "super-auswahl.de", "supergreatmail.com", "supermailer.jp",
    "superstachel.de", "suremail.info", "sweetpotato.ml",
    "swift-mail.com", "sxzevvhpmhletqom.tk", "tafmail.com",
    "techemail.com", "telecomix.pl", "tmail.com",
    "tmpmail.net", "tmpmail.org", "tos-violating.us",
    "tradermail.info", "trash2009.com", "trash2010.com",
    "trash2011.com", "trashdevil.com", "trashdevil.de",
    "trashemail.de", "trashmail.at", "trashtmail.com",
    "trillianpro.com", "trsh.me", "turual.com",
    "twinmail.de", "tyldd.com", "uggsrock.com",
    "umail.net", "upliftnow.com", "uplipht.com",
    "uroid.com", "usa.cc", "venompen.com",
    "veryrealemail.com", "viditag.com", "viewcastmedia.com",
    "viewcastmedia.net", "viewcastmedia.org", "vpn.st",
    "walala.org", "walkmail.net", "wasteland.rfc822.org",
    "webemail.me", "webm4il.info", "wegwerfemail.de",
    "wetrainbayarea.org", "wh4f.org", "whyspam.me",
    "wikidocuslava.ru", "willselfdestruct.com", "winemaven.info",
    "wolfsmail.tk", "wuzupmail.net", "xagloo.com",
    "xemaps.com", "xents.com", "xmail5.com",
    "xmaily.com", "xoxox.cc", "xyzfree.net",
    "yepmail.net", "yomail.info", "yourspamgoeshere.com",
    "z1p.biz", "za.com", "zehnminuten.de",
    "zehnminutenmail.de", "zetmail.com", "zippymail.info",
    "zoaxe.com", "zoemail.net", "zoemail.org",
    "zomg.info", "zsero.com", "zxcv.com", "zxcvbnm.com",
}

# ── In-Memory Blocklist Cache ─────────────────────────────────────────────────
_blocklist: set[str] = set()
_blocklist_loaded: bool = False


def load_blocklist() -> None:
    """
    Download the disposable email blocklist from GitHub.
    Falls back to the hardcoded list on any network failure.
    Call this once at application startup (lifespan).
    """
    global _blocklist, _blocklist_loaded

    try:
        import urllib.request
        req = urllib.request.Request(
            _BLOCKLIST_URL,
            headers={"User-Agent": "TwinPath-Security/1.0"},
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            raw = response.read().decode("utf-8")

        domains: set[str] = set()
        for line in raw.splitlines():
            line = line.strip().lower()
            if line and not line.startswith("#"):
                domains.add(line)

        if len(domains) > 1000:
            _blocklist = domains
            _blocklist_loaded = True
            logger.info(
                "Disposable email blocklist loaded from remote",
                domain_count=len(_blocklist),
            )
        else:
            raise ValueError("Remote blocklist suspiciously small — using fallback")

    except Exception as exc:
        logger.warning(
            "Could not load remote disposable email blocklist — using fallback",
            error=str(exc),
            fallback_count=len(_FALLBACK_BLOCKLIST),
        )
        _blocklist = _FALLBACK_BLOCKLIST.copy()
        _blocklist_loaded = True


def is_disposable_email(email: str) -> bool:
    """
    Return True if the email domain is on the disposable blocklist.

    Args:
        email: Full email address string (e.g., 'user@mailinator.com')

    Returns:
        True  → email is disposable / temporary → BLOCK registration
        False → email appears legitimate → ALLOW registration
    """
    if not _blocklist_loaded:
        # Defensive fallback: if called before load_blocklist(), use hardcoded
        load_blocklist()

    try:
        domain = email.strip().lower().split("@")[-1]
        return domain in _blocklist
    except Exception:
        return False  # On any parse error, allow the email (don't block)
