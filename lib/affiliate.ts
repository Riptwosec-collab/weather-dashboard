const fallbackAffiliateBuyLink =
  "https://shopee.co.th/search?keyword=%E0%B9%80%E0%B8%AA%E0%B8%B7%E0%B9%89%E0%B8%AD%E0%B8%81%E0%B8%B1%E0%B8%99%E0%B9%9D%E0%B8%99%20%E0%B8%9E%E0%B8%81%E0%B8%9E%E0%B8%B2";

export function getAffiliateBuyLink() {
  return process.env.NEXT_PUBLIC_AFFILIATE_BUY_LINK ?? fallbackAffiliateBuyLink;
}
