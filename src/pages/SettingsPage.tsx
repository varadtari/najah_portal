import { useState, type FormEvent } from 'react'

import { useAddDevice, useDevices } from '../api/queries'
import { AccessRules } from '../components/AccessRules'
import { DeviceCard } from '../components/DeviceCard'
import { useToast } from '../components/toast-context'

function AddDeviceForm() {
  const add = useAddDevice()
  const toast = useToast()
  const [serialNumber, setSerialNumber] = useState('')
  const [name, setName] = useState('Front door')

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    try {
      const device = await add.mutateAsync({ serialNumber: serialNumber.trim(), name: name.trim() })
      toast(`${device.name} added. Now set it up on the device.`)
      setSerialNumber('')
    } catch {
      // shown from add.error
    }
  }

  return (
    <form className="glass card" onSubmit={onSubmit}>
      <h3 style={{ margin: '0 0 4px' }}>Add a device</h3>
      <p className="sub" style={{ marginBottom: 14 }}>
        Use the serial number on the device's label or under Menu → System Info. Supported: eSSL AI Face Magnum.
      </p>
      <div className="inline-form">
        <div>
          <label htmlFor="serial">Serial number</label>
          <input id="serial" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="e.g. CQZ7224460014" autoComplete="off" required maxLength={64} />
        </div>
        <div>
          <label htmlFor="device-name">Name</label>
          <input id="device-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
        </div>
        <button className="btn" type="submit" disabled={add.isPending || !serialNumber.trim() || !name.trim()}>
          {add.isPending ? 'Adding…' : 'Add device'}
        </button>
      </div>
      {add.error && (
        <div className="form-error" role="alert">
          {add.error.message}
        </div>
      )}
    </form>
  )
}

export function SettingsPage() {
  const { data: devices = [], isPending, error } = useDevices()

  return (
    <>
      <div className="top">
        <div>
          <h2>Settings</h2>
          <p>Door access and devices</p>
        </div>
      </div>

      <AccessRules />

      <h2 className="section-title">Devices</h2>
      {error && <div className="form-error">{error.message}</div>}
      {isPending ? <div className="loading">Loading…</div> : devices.map((device) => <DeviceCard key={device.id} device={device} />)}

      <AddDeviceForm />
    </>
  )
}
