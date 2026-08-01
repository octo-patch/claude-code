import type { AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS } from '../../services/analytics/index.js'
import { isEnvTruthy } from '../envUtils.js'

export type APIProvider =
  | 'firstParty'
  | 'bedrock'
  | 'vertex'
  | 'foundry'
  | 'minimax'

export const MINIMAX_ENDPOINTS = {
  global_en: {
    anthropicBaseUrl: 'https://api.minimax.io/anthropic',
    openaiBaseUrl: 'https://api.minimax.io/v1',
    docsRoot: 'https://platform.minimax.io/docs',
  },
  cn_zh: {
    anthropicBaseUrl: 'https://api.minimaxi.com/anthropic',
    openaiBaseUrl: 'https://api.minimaxi.com/v1',
    docsRoot: 'https://platform.minimaxi.com/docs',
  },
} as const

export type MiniMaxRegion = keyof typeof MINIMAX_ENDPOINTS

function isMiniMaxAnthropicBaseUrlValue(baseUrl: string | undefined): boolean {
  if (!baseUrl) {
    return false
  }
  try {
    const url = new URL(baseUrl)
    return (
      url.protocol === 'https:' &&
      (url.host === 'api.minimax.io' || url.host === 'api.minimaxi.com') &&
      url.pathname.replace(/\/+$/, '') === '/anthropic'
    )
  } catch {
    return false
  }
}

function isMiniMaxAnthropicBaseUrl(): boolean {
  return (
    isMiniMaxAnthropicBaseUrlValue(process.env.ANTHROPIC_BASE_URL) ||
    isMiniMaxAnthropicBaseUrlValue(process.env.ANTHROPIC_MINIMAX_BASE_URL)
  )
}

export function getMiniMaxRegion(): MiniMaxRegion {
  const configuredBaseUrl =
    process.env.ANTHROPIC_MINIMAX_BASE_URL || process.env.ANTHROPIC_BASE_URL
  if (isMiniMaxAnthropicBaseUrlValue(configuredBaseUrl)) {
    return new URL(configuredBaseUrl).host === 'api.minimaxi.com'
      ? 'cn_zh'
      : 'global_en'
  }
  return process.env.CLAUDE_CODE_MINIMAX_REGION === 'cn_zh'
    ? 'cn_zh'
    : 'global_en'
}

export function getMiniMaxAnthropicBaseUrl(): string {
  if (isMiniMaxAnthropicBaseUrlValue(process.env.ANTHROPIC_MINIMAX_BASE_URL)) {
    return process.env.ANTHROPIC_MINIMAX_BASE_URL
  }
  if (isMiniMaxAnthropicBaseUrlValue(process.env.ANTHROPIC_BASE_URL)) {
    return process.env.ANTHROPIC_BASE_URL
  }
  return (
    MINIMAX_ENDPOINTS[getMiniMaxRegion()].anthropicBaseUrl
  )
}

export function getAPIProvider(): APIProvider {
  return isEnvTruthy(process.env.CLAUDE_CODE_USE_BEDROCK)
    ? 'bedrock'
    : isEnvTruthy(process.env.CLAUDE_CODE_USE_VERTEX)
      ? 'vertex'
      : isEnvTruthy(process.env.CLAUDE_CODE_USE_FOUNDRY)
        ? 'foundry'
        : isEnvTruthy(process.env.CLAUDE_CODE_USE_MINIMAX) ||
            isMiniMaxAnthropicBaseUrl()
          ? 'minimax'
          : 'firstParty'
}

export function getAPIProviderForStatsig(): AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS {
  return getAPIProvider() as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
}

/**
 * Check if ANTHROPIC_BASE_URL is a first-party Anthropic API URL.
 * Returns true if not set (default API) or points to api.anthropic.com
 * (or api-staging.anthropic.com for ant users).
 */
export function isFirstPartyAnthropicBaseUrl(): boolean {
  const baseUrl = process.env.ANTHROPIC_BASE_URL
  if (!baseUrl) {
    return true
  }
  try {
    const host = new URL(baseUrl).host
    const allowedHosts = ['api.anthropic.com']
    if (process.env.USER_TYPE === 'ant') {
      allowedHosts.push('api-staging.anthropic.com')
    }
    return allowedHosts.includes(host)
  } catch {
    return false
  }
}
