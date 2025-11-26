import axios from "axios";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let { cookies } = req.body;

    if (!Array.isArray(cookies)) cookies = [cookies];
    cookies = cookies.map(s => String(s || "").trim()).filter(Boolean);

    if (!cookies.length) {
      return res.status(400).json({ error: "Chưa có cookie" });
    }

    const WORKER_URL = "https://1.doanngocminhquy.workers.dev";

    const r = await axios.post(WORKER_URL + "/orders",
      { cookies },
      { headers: { "Content-Type": "application/json" }, timeout: 20000 }
    );

    const html = r.data;

    const $ = cheerio.load(html);
    const orders = [];

    $("table tbody tr").each((_, tr) => {
      const tds = $(tr).find("td");
      if (tds.length < 3) return;

      orders.push({
        stt: $(tds[0]).text().trim(),
        mvd: $(tds[1]).text().trim(),
        status: $(tds[2]).text().trim(),
        receiver: $(tds[3]).text().trim(),
        receiverPhone: $(tds[4]).text().trim(),
        address: $(tds[5]).attr("title")?.trim() || $(tds[5]).text().trim(),
        productImg: $(tds[6]).find("img").attr("src") || null,
        shipperName: $(tds[7]).text().trim(),
        shipperPhone: $(tds[8]).text().trim(),
      });
    });

    return res.json({ count: orders.length, orders });

  } catch (e) {
    return res.status(500).json({
      error: "Lỗi lấy đơn qua Worker",
      detail: e?.response?.data || e.message,
    });
  }
}
