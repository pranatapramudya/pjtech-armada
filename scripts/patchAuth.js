const fs = require('fs');
let code = fs.readFileSync('components/AuthScreen.tsx', 'utf8');

// Replace import
code = code.replace(
  "import { saveOfflineJuragan } from '@/lib/offlineStorage'",
  "import { saveOfflineJuragan, syncCloudDataToOffline } from '@/lib/offlineStorage'\nimport { registerTenantCloudAction, loginTenantCloudAction } from '@/app/actions/auth'"
);

// Add icons
code = code.replace(
  "  Lock,",
  "  Lock,\n  LogIn,\n  UserPlus,"
);

// Add states
code = code.replace(
  "  const [isRegister, setIsRegister] = useState<boolean>(!hasRegistered)",
  "  const [activeTab, setActiveTab] = useState<'register' | 'login'>('register')\n  const [loginPhoneInput, setLoginPhoneInput] = useState('')\n  const [loginPinInput, setLoginPinInput] = useState('')\n  const [showLoginPin, setShowLoginPin] = useState(false)\n  const [isSubmitting, setIsSubmitting] = useState(false)"
);

// Add cross-device login handler
const handleLoginCrossDevice = `
  // Submit Login Lintas Perangkat (Sync dari Cloud Neon Database)
  const handleExecuteLoginCrossDevice = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!loginPhoneInput.trim()) {
      setErrorMsg('Nomor WhatsApp wajib diisi!')
      triggerHaptic(50)
      return
    }
    if (!loginPinInput.trim() || loginPinInput.length < 4) {
      setErrorMsg('Masukkan minimal 4 digit PIN!')
      triggerHaptic(50)
      return
    }

    setIsSubmitting(true)
    playClickSound()
    triggerHaptic(30)

    try {
      const cloudRes = await loginTenantCloudAction(loginPhoneInput, loginPinInput)

      if (cloudRes.success && cloudRes.user) {
        const u = cloudRes.user
        const localAcc = registerUser(
          u.namaJuragan,
          u.noHp,
          u.pin,
          (u.paket as PaketLangganan) || 'TRIAL',
          u.email || ''
        )

        syncCloudDataToOffline({
          namaJuragan: u.namaJuragan,
          noHp: u.noHp,
          angkotList: u.angkotList,
          setoranList: u.setoranList,
        })

        playSuccessSound()
        triggerHaptic(50)
        onAuthSuccess(localAcc)
      } else {
        const localCheck = loginUser(loginPhoneInput, loginPinInput)
        if (localCheck.success && localCheck.account) {
          playSuccessSound()
          onAuthSuccess(localCheck.account)
        } else {
          setErrorMsg(cloudRes.message || 'Nomor WhatsApp atau PIN salah!')
          triggerHaptic(60)
        }
      }
    } catch (err: any) {
      setErrorMsg('Koneksi database gagal: ' + (err.message || 'Error'))
      triggerHaptic(60)
    } finally {
      setIsSubmitting(false)
    }
  }
`;

code = code.replace(
  "  // Submit login PIN",
  handleLoginCrossDevice + "\n  // Submit login PIN"
);

// Add cloud registration on finish
code = code.replace(
  "    const acc = registerUser(namaJuragan, noHp, pin, paket, email)",
  "    try {\n      await registerTenantCloudAction({ namaJuragan, noHp, email, pin, paket })\n    } catch (e) {}\n    const acc = registerUser(namaJuragan, noHp, pin, paket, email)"
);

// Add Tab UI for new devices
const tabsUi = `
          {/* JIKA BELUM ADA AKUN SAMA SEKALI: FORM PENDAFTARAN ATAU LOGIN LINTAS DEVICE */}
          {!hasRegistered && (
            <div className="mt-4">
              {/* TAB PILIHAN: DAFTAR BARU ATAU SUDAH PUNYA AKUN */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-4">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound()
                    triggerHaptic(20)
                    setActiveTab('register')
                    setErrorMsg(null)
                  }}
                  className={\`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer \${
                    activeTab === 'register'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }\`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Daftar Baru</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClickSound()
                    triggerHaptic(20)
                    setActiveTab('login')
                    setErrorMsg(null)
                  }}
                  className={\`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer \${
                    activeTab === 'login'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }\`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sudah Punya Akun</span>
                </button>
              </div>

              {/* FORM LOGIN AKUN LINTAS DEVICE */}
              {activeTab === 'login' && (
                <form onSubmit={handleExecuteLoginCrossDevice} className="space-y-4 animate-in fade-in duration-150">
                  <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900">
                    <span className="font-bold block">Masuk di Perangkat Baru</span>
                    Masukkan Nomor WhatsApp dan PIN akun Anda untuk menarik data armada dari server cloud.
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      Nomor WhatsApp Terdaftar:
                    </label>
                    <input
                      type="tel"
                      placeholder="Contoh: 081234567890"
                      value={loginPhoneInput}
                      onChange={(e) => setLoginPhoneInput(e.target.value)}
                      className="w-full h-11 px-3.5 text-sm font-semibold text-slate-800 bg-slate-50/80 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      PIN Akun (6 Digit):
                    </label>
                    <div className="relative">
                      <input
                        type={showLoginPin ? 'text' : 'password'}
                        maxLength={6}
                        placeholder="Masukkan 6 angka PIN"
                        value={loginPinInput}
                        onChange={(e) => setLoginPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full h-11 px-3.5 pr-11 text-center font-mono text-lg tracking-widest font-bold text-slate-900 bg-slate-50/80 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPin(!showLoginPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                      >
                        {showLoginPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 font-bold p-3 rounded-xl text-xs text-center animate-shake">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-xs cursor-pointer transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                  >
                    <span>{isSubmitting ? 'Menghubungkan ke Cloud...' : 'Masuk & Sinkronkan Data'}</span>
                    <LogIn className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </form>
              )}
`;

code = code.replace(
  "{!hasRegistered && regStep === 'form' && (",
  tabsUi + "\n              {activeTab === 'register' && regStep === 'form' && ("
);

// Close the tab div at the end of the registration flow
code = code.replace(
  "              {/* JIKA SUDAH ADA AKUN DAN INGIN PILIH PAKET SETELAH REGISTRASI */}\n              {regStep === 'paket' && (",
  "              {/* JIKA SUDAH ADA AKUN DAN INGIN PILIH PAKET SETELAH REGISTRASI */}\n              {activeTab === 'register' && regStep === 'paket' && ("
);

// Close wrapper
code = code.replace(
  "                  </div>\n                </div>\n              )}\n            </form>\n          )}\n        </div>",
  "                  </div>\n                </div>\n              )}\n            </div>\n          )}\n        </div>"
);

fs.writeFileSync('components/AuthScreen.tsx', code, 'utf8');
console.log('Successfully patched AuthScreen.tsx');
