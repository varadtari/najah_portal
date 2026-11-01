interface ImportMetaEnv {
  /** Host devices are pointed at (Cloud Server address), e.g. "adms.najah.app" or a LAN IP. */
  readonly VITE_ADMS_SERVER?: string
  /** Port for the Cloud Server setting. */
  readonly VITE_ADMS_PORT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
