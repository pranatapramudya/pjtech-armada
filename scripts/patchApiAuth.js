const fs = require('fs');
let code = fs.readFileSync('components/AuthScreen.tsx', 'utf8');

const oldFinishTarget = `  // Selesai pilih paket -> simpan akun tunggal
  const handleSelectPaketAndFinish = async (paket: PaketLangganan) => {
    playSuccessSound()
    triggerHaptic(50)

    try {
      await registerTenantCloudAction({ namaJuragan, noHp, email, pin, paket })
    } catch (e) {}
    const acc = registerUser(namaJuragan, noHp, pin, paket, email)
    saveOfflineJuragan(namaJuragan, noHp)

    if (paket === 'SEMESTER' || paket === 'TAHUNAN') {
      const url = getMayarPaymentUrl(paket, { namaJuragan, noHp, email })
      window.open(url, '_blank')
    }

    onAuthSuccess(acc)
  }`;

const newFinish = `  // Selesai pilih paket -> simpan akun tunggal & push ke Cloud Neon
  const handleSelectPaketAndFinish = async (paket: PaketLangganan) => {
    playSuccessSound()
    triggerHaptic(50)
    setErrorMsg(null)

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          namaJuragan,
          noHp,
          email,
          pin,
          paket,
        }),
      });
      const data = await res.json();
      if (!data.success && data.message && data.message.includes('sudah terdaftar')) {
        setErrorMsg(data.message);
        triggerHaptic(60);
        return;
      }
    } catch (e) {
      console.warn('Offline register fallback:', e);
    }

    const acc = registerUser(namaJuragan, noHp, pin, paket, email)
    saveOfflineJuragan(namaJuragan, noHp)

    if (paket === 'SEMESTER' || paket === 'TAHUNAN') {
      const url = getMayarPaymentUrl(paket, { namaJuragan, noHp, email })
      window.open(url, '_blank')
    }

    onAuthSuccess(acc)
  }`;

code = code.replace(oldFinishTarget, newFinish);

const oldLoginTarget = `    try {
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
    }`;

const newLoginTarget = `    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          noHp: loginPhoneInput,
          pin: loginPinInput,
        }),
      });
      const cloudRes = await res.json();

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
    }`;

code = code.replace(oldLoginTarget, newLoginTarget);

fs.writeFileSync('components/AuthScreen.tsx', code, 'utf8');
console.log('Successfully patched AuthScreen to use /api/auth');
