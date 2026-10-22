// path: src/apps/heraclitus/components/VideoListTable.tsx

import React, { useState, useMemo } from 'react'
import { Search, ExternalLink, Film, Check, Copy } from 'lucide-react'
import type { VideoItem } from '../types'

interface VideoListTableProps {
  videos: VideoItem[]
  playlistTitle: string
}

export const VideoListTable: React.FC<VideoListTableProps> = ({ videos, playlistTitle }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [copied, setCopied] = useState(false)

  const filteredVideos = useMemo(() => {
    const q = searchTerm.toLowerCase().trim()
    if (!q) return videos
    return videos.filter((v) => v.title.toLowerCase().includes(q))
  }, [videos, searchTerm])

  const handleCopySummary = async () => {
    const lines = [
      `Playlist: ${playlistTitle}`,
      `Total Tracks: ${videos.length}`,
      ...videos.map((v, i) => `${i + 1}. [${v.duration_formatted}] ${v.title} - ${v.url}`),
    ]
    await navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-[#100d16]/95 border border-[#2b2138] rounded-2xl p-5 shadow-xl">
      {/* Search & Actions Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Film className="w-5 h-5 text-[#ffd86b]" />
          <div>
            <h3 className="font-cinzel font-bold text-sm text-white uppercase tracking-wider">
              Playlist Track Manifest
            </h3>
            <span className="text-xs text-[#8c7a9e] font-mono">
              Showing {filteredVideos.length} of {videos.length} videos
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search Input (min-h-[44px] per Monolithic Vertical Height Law) */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-[#8c7a9e] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter tracks by title..."
              className="w-full min-h-[44px] pl-9 pr-3 rounded-xl bg-[#171220] border border-[#322642] focus:border-[#ffd86b] text-xs font-mono text-white placeholder-[#6a5e78] outline-none transition"
            />
          </div>

          {/* Copy Summary Button */}
          <button
            type="button"
            onClick={handleCopySummary}
            className="min-h-[44px] px-3.5 rounded-xl bg-[#1c1527] hover:bg-[#271d36] border border-[#44335a] hover:border-[#ffd86b] text-xs font-cinzel font-bold text-[#ffd86b] transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95"
            title="Copy manifest to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Manifest'}</span>
          </button>
        </div>
      </div>

      {/* Track List Outliner */}
      <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {filteredVideos.map((video, idx) => (
          <div
            key={video.id || idx}
            className="min-h-[52px] p-3 rounded-xl bg-[#140f1c] hover:bg-[#1b1526] border border-[#261d33] hover:border-[#3e2e54] flex items-center justify-between gap-3 transition-all duration-150 group video-row-hover hover:translate-x-1"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-7 text-right font-mono text-xs font-bold text-[#6a5e78] flex-shrink-0">
                {(idx + 1).toString().padStart(2, '0')}
              </span>
              <span className="font-sans text-xs text-slate-200 group-hover:text-white truncate font-medium">
                {video.title}
              </span>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg border ${
                video.duration !== null
                  ? 'bg-[#1b1624] border-[#382b4a] text-[#ffd86b]'
                  : 'bg-red-950/40 border-red-800/40 text-red-400'
              }`}>
                {video.duration_formatted}
              </span>

              {video.url && (
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-[#1e172a] hover:bg-[#2b1f3c] text-[#8c7a9e] hover:text-white transition"
                  title="Open video in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
