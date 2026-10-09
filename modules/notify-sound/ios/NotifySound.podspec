Pod::Spec.new do |s|
  s.name           = 'NotifySound'
  s.version        = '1.0.0'
  s.summary        = 'Sonidos de aviso de Mandalo con la app abierta'
  s.description    = 'Modulo local: sonido de mensaje recibido dentro del chat.'
  s.author         = 'Mandalo'
  s.homepage       = 'https://somosmandalo.com'
  s.platforms      = {
    :ios => '15.1'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
