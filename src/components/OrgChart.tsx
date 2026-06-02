"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ORG_GROUPS = [
  {
    id: "wxg",
    name: "微信事业群",
    shortName: "WXG",
    description: "负责微信、微信支付、企业微信等产品的开发与运营",
    coreProducts: ["微信", "微信支付", "企业微信"],
    color: "from-green-500 to-emerald-600",
    bgColor: "bg-green-50",
    icon: "💬",
  },
  {
    id: "ieg",
    name: "互动娱乐事业群",
    shortName: "IEG",
    description: "负责游戏研发与运营，致力于为用户提供高品质的游戏娱乐体验",
    coreProducts: ["王者荣耀", "和平精英", "英雄联盟"],
    color: "from-purple-500 to-pink-600",
    bgColor: "bg-purple-50",
    icon: "🎮",
  },
];

interface OrgChartProps {
  onViewJobs?: (orgId: string) => void;
}

export default function OrgChart({ onViewJobs }: OrgChartProps) {
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ORG_GROUPS.map((org) => (
          <motion.div
            key={org.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onClick={() => setSelectedOrg(selectedOrg === org.id ? null : org.id)}
            className="cursor-pointer rounded-2xl border-2 border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300"
          >
            <div className={`bg-gradient-to-br ${org.color} p-6 text-white`}>
              <h3 className="font-bold text-xl mb-2">{org.name}</h3>
              <p className="text-white/80 text-sm">{org.shortName}</p>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-3">{org.description}</p>
              <div className="flex flex-wrap gap-2">
                {org.coreProducts.map((product, index) => (
                  <span key={`${org.id}-${index}`} className="px-2 py-1 bg-gray-100 rounded text-xs">
                    {product}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
