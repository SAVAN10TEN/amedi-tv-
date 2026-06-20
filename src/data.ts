import { Channel, Category, Episode } from './types';

export const CATEGORIES: Category[] = [
  'All', 'Kurdish', 'Badini', 'Arabic', 'General', 'News', 'Sports', 'Music', 'Radio', 'Islamic', 'Kids'
];

export const CHANNELS: Channel[] = [
  {
    id: 'ava-media',
    name: 'AVA Media',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHjoEAP1GGyOn-_z3KpXocINiq6Pjo4RR3OpRoEf5G4w&s=10',
    categories: ['Kurdish', 'News', 'General'],
    streamUrl: '/api/proxy?url=https://ava2.store/upload/ava.m3u8'
  },
  {
    id: 'rudaw',
    name: 'Rudaw',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSn5GWJGa6oHJVSumqBBhIaNeNcgX6wp7ZtkFTfwUd8mQ&s=10',
    categories: ['Kurdish', 'News'],
    streamUrl: '/api/proxy?url=https://live.rudaw.net/hls/rudaw-tv/master.m3u8'
  },
  {
    id: 'channel8',
    name: 'Channel 8',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0cRMylt9FVZfSGc3fxkHegG580fGqN5dbd7IXz5Vj_w&s=10',
    categories: ['Kurdish', 'General'],
    streamUrl: '/api/proxy?url=https://live.channel8.com/Channel8-Kurdish/playlist.m3u8'
  },
  {
    id: 'hormzyar-hd',
    name: 'HormzyarHD',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAufnJyvFKvqqVCs_A2IrNaNOBM7k7_cr45RO68bm7TQ&s=10',
    categories: ['Kurdish', 'General'],
    streamUrl: '/api/proxy?url=https://avr.host247.net/live/HormzyarHD/playlist.m3u8'
  },
  {
    id: 'waar',
    name: 'WAR',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSz-_1CZfSn2DQlFDm7dUuTdGPYtlIMFNgaLbvbk_0xAA&s=10',
    categories: ['Kurdish', 'General', 'Badini'],
    streamUrl: '/api/proxy?url=https://live.kwikmotion.com/waarmedialive/waarmedia.smil/playlist.m3u8'
  },
  {
    id: 'avar',
    name: 'Avar',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRdqIz4lxYcyVFVQ3_CQiQr1z_xDVZK2quQeeu2HoI0ng&s=10',
    categories: ['Kurdish', 'General'],
    streamUrl: '/api/proxy?url=https://avr.host247.net/live/AvarTv/playlist.m3u8'
  },
  {
    id: 'nrt',
    name: 'NRT',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS2Pvt6sCdWqS5US76U_27WOXP8bk7vB0-Oyu4_0KaFhA&s=10',
    categories: ['Kurdish', 'News'],
    streamUrl: '/api/proxy?url=https://hlspackager.akamaized.net/live/DB/NRT_HD/HLS/NRT_HD.m3u8'
  },
  {
    id: 'nrt2',
    name: 'NRT 2',
    logo: 'https://images.ntviraq.com/wene/nrt2llogo.png',
    categories: ['Kurdish', 'General'],
    streamUrl: '/api/proxy?url=https://ca-rt.onetv.app/NRT2/index-0.m3u8?token=onetv202'
  },
  {
    id: 'nrt4',
    name: 'NRT 4',
    logo: 'https://i.postimg.cc/hhJQm8Jz/image.png',
    categories: ['Kurdish', 'General'],
    streamUrl: '/api/proxy?url=https://karwan.tv/nrt-4/index.m3u8'
  },
  {
    id: 'k24',
    name: 'K24 News',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ54KZVUIESBm87JuL4Kh7He5Gyq7bpxdgseb7xBSFCNg&s',
    categories: ['Kurdish', 'News'],
    streamUrl: '/api/proxy?url=https://d1x82nydcxndze.cloudfront.net/live/index.m3u8'
  },
  {
    id: 'kurdsat',
    name: 'Kurdsat',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-HVYkR5sv7xyjp7TdVE0e42uroV6P9pEkQcZ7x1husw&s=10',
    categories: ['Kurdish', 'General'],
    streamUrl: '/api/proxy?url=https://hlspackager.akamaized.net/live/DB/KURDSAT_HD/HLS/KURDSAT_HD.m3u8'
  },
  {
    id: 'kurdsat-news',
    name: 'Kurdsat News',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQl3j_g3H9TsH22SoBtZcMkRyspRxPJ6NR8hd0hJsLhlA&s=10',
    categories: ['Kurdish', 'News'],
    streamUrl: '/api/proxy?url=https://hlspackager.akamaized.net/live/DB/KURDSAT_NEWS/HLS/KURDSAT_NEWS.m3u8'
  },
  {
    id: 'speda',
    name: 'Speda TV',
    logo: 'https://i.postimg.cc/ftRjbg6j/FB-IMG-1779853706982.jpg',
    categories: ['Kurdish', 'Islamic'],
    streamUrl: '/api/proxy?url=https://5a3ed7a72ed4b.streamlock.net/spedatv/SMIL:myStream.smil/playlist.m3u8'
  },
  {
    id: 'payam',
    name: 'Payam TV',
    logo: 'https://i.postimg.cc/BtdHW6Qy/FB-IMG-1779853816303.jpg',
    categories: ['Kurdish', 'Islamic'],
    streamUrl: '/api/proxy?url=https://karwan.tv/payam-tv/index.m3u8'
  },
  {
    id: 'gali-kurdistan',
    name: 'Gali Kurdistan',
    logo: 'https://www.gksat.tv/images/logo.png',
    categories: ['Kurdish', 'General'],
    streamUrl: '/api/proxy?url=https://live.host247.net/gk/gksat/playlist.m3u8'
  },
  {
    id: 'kurdistan-tv',
    name: 'Kurdistan TV',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQoOl3Vei2ZlXLV9wabf6D695LYqglHO0fRXXdg-m26MQ&s=10',
    categories: ['Kurdish', 'General'],
    streamUrl: '/api/proxy?url=https://5a3ed7a72ed4b.streamlock.net/live/SMIL:myStream.smil/playlist.m3u8'
  },
  {
    id: 'ava-sport',
    name: 'Ava Sport',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8KD3aXED_EHnCkOD-DzobmB5fYImftbEsb8QN6hJvdw&s=10',
    categories: ['Kurdish', 'Sports'],
    streamUrl: '/api/proxy?url=https://karwan.tv/ava-sport/index.m3u8'
  },
  {
    id: 'nrt-sport',
    name: 'NRT Sport',
    logo: 'https://i.postimg.cc/9ff3HPTk/nrt-sport.png',
    categories: ['Kurdish', 'Sports'],
    streamUrl: '/api/proxy?url=https://karwan.tv/nrt-sport/index.m3u8'
  },
  {
    id: 'ala-tv',
    name: 'Ala TV',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS61Czh_ehcr8vfcgjmtw_hSpkaj0WFRa-DmLS0RHZG4A&s=10',
    categories: ['Kurdish', 'General'],
    streamUrl: '/api/proxy?url=http://avrstream.com:1935/live/ala-hd/playlist.m3u8'
  },
  {
    id: 'parwarday-hawler',
    name: 'Parwarday Hawler',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUmScJbd_cYjJsOj3yUts3j-syG4A3V4061FDlh6s_ag&s=10',
    categories: ['Kurdish', 'General'],
    streamUrl: '/api/proxy?url=https://parwarda.unitedmixmedia.tv/Parwardayi_Hawler/tracks-v2a1/mono.m3u8'
  },
  {
    id: 'parwarday-slemany',
    name: 'Parwarday Sleman',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUmScJbd_cYjJsOj3yUts3j-syG4A3V4061FDlh6s_ag&s=10',
    categories: ['Kurdish', 'General'],
    streamUrl: '/api/proxy?url=https://parwarda.unitedmixmedia.tv/Parwarda/tracks-v2a1/mono.m3u8'
  },
  {
    id: 'parwarday-duhok',
    name: 'Parwarday Duhok',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUmScJbd_cYjJsOj3yUts3j-syG4A3V4061FDlh6s_ag&s=10',
    categories: ['Kurdish', 'General', 'Badini'],
    streamUrl: '/api/proxy?url=https://parwarda.unitedmixmedia.tv/Parwardayi_Duhok/tracks-v2a1/mono.m3u8'
  },
  {
    id: 'red-tv',
    name: 'Red TV',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5_NDROEufefimTCh6J-EckxBGTH5Tn6wqQ-pReONT0g&s=10',
    categories: ['Kurdish', 'General'],
    streamUrl: '/api/proxy?url=http://avrstream.com:1935/live/REDTV/playlist.m3u8'
  },
  {
    id: 'shams-tv',
    name: 'Shams TV',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQRQxRTXwX0JK_0OCgeHqtm7X3c9BWJ_snWzkQN5npXog&s=10',
    categories: ['Kurdish', 'General'],
    streamUrl: '/api/proxy?url=https://stream.shams.tv/hls/stream.m3u8'
  },
  {
    id: 'gawhar',
    name: 'Gawhar',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT-EcxORVKUlrCF2IzEUYeLxA_g8o7UfV6z_hk31ZkS6A&s=10',
    categories: ['Kurdish', 'News'],
    streamUrl: '/api/proxy?url=https://karwan.tv/gewher-sport/index.m3u8'
  },
  {
    id: 'mix-kurdish',
    name: 'Mix Kurdish',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTDjDq-KWD1EoZYkppHRU77oNNO_20c_51M3ubfrR4rhN4o49eUiHer0oII&s=10',
    categories: ['Kurdish', 'General'],
    streamUrl: '/api/proxy?url=http://avrstream.com:1935/live/Mix-kurdy/playlist.m3u8'
  },
  {
    id: 'mbc-2',
    name: 'MBC 2',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSzUYnBDPnry1j6dPS7lxXD2DPlE0Z3PH1tSTdpXMs6HQ&s=10',
    categories: ['Arabic', 'General'],
    streamUrl: '/api/proxy?url=http://154.58.202.18:8080/mbc2/mono.m3u8'
  },
  {
    id: 'mmn-movies',
    name: 'MMN Movies',
    logo: 'https://i.postimg.cc/633CQd70/MMNM.png',
    categories: ['Kurdish', 'General'],
    streamUrl: '/api/proxy?url=http://mmn.mypsx.net:1935/live/mmnhdmovies/playlist.m3u8'
  },
  {
    id: 'mmn-sports',
    name: 'MMN Sports',
    logo: 'https://i.postimg.cc/sDnTz9TT/MMNSPORT.png',
    categories: ['Kurdish', 'Sports'],
    streamUrl: '/api/proxy?url=http://mmn.mypsx.net:1935/live/mmnhdsport/playlist.m3u8'
  },
  {
    id: 'mmn-show',
    name: 'MMN Show',
    logo: 'https://i.postimg.cc/9XJpPQPK/MMNSHOW.png',
    categories: ['Kurdish', 'General'],
    streamUrl: '/api/proxy?url=http://mmn.mypsx.net:1935/live/mmnhddshow/playlist.m3u8'
  },
  {
    id: 'mmn-news',
    name: 'MMN News',
    logo: 'https://i.postimg.cc/HJg1Fbfp/unwatermarked-1000066148.png',
    categories: ['Kurdish', 'News'],
    streamUrl: '/api/proxy?url=https://karwan.tv/mmn-news/index.m3u8'
  },
  {
    id: 'shna-quran',
    name: 'Amozhgary',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRtpxtcydRCbh8hyQSxg3gTSd7TbXkgdKp4ZZaCJteBuA&s=10',
    categories: ['Kurdish', 'Islamic'],
    streamUrl: '/api/proxy?url=https://app-live.org/live/3268334b/index.m3u8'
  },
  {
    id: 'bbc-news',
    name: 'BBC NEWS',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRiUhhqz3ivyM_tCxOTxH5rxW04Hfiv7s2glTXC2pOJbQ&s=10',
    categories: ['News'],
    streamUrl: '/api/proxy?url=https://vs-hls-push-ww-live.akamaized.net/x=4/i=urn:bbc:pips:service:bbc_news_channel_hd/t=3840/v=pv14/b=5070016/main.m3u8'
  },
  {
    id: 'al-hadath',
    name: 'Al Hadath',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSMfRfQUI0UnfeQTRFkNHJqnC1KR_vRb9bvky7ZLHN7Ag&s=10',
    categories: ['Arabic', 'News'],
    streamUrl: '/api/proxy?url=https://live.alarabiya.net/alarabiapublish/alhadath.smil/playlist.m3u8'
  },
  {
    id: 'al-arabiya',
    name: 'Al Arabiya',
    logo: 'https://i.postimg.cc/L8DwkKRP/IMG-20260520-010851.jpg',
    categories: ['Arabic', 'News'],
    streamUrl: '/api/proxy?url=https://live.alarabiya.net/alarabiapublish/alarabiya.smil/playlist.m3u8'
  },
  {
    id: 'al-jazeera',
    name: 'Al Jazeera',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0UL3eoWl2JGKgjkCoOrKlCMQ86gJXI-ry2OkK6qke0Q&s=10',
    categories: ['Arabic', 'News'],
    streamUrl: '/api/proxy?url=https://dash4.antik.sk/live/test_aljazeera/playlist.m3u8'
  },
  {
    id: 'bein-sport',
    name: 'beIN Sports 1',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRa_dNQT8CJe_5CPV_Lixr1FqCRbWshjqbIyzZO9w5jWw&s=10',
    categories: ['Sports'],
    streamUrl: '/api/proxy?url=https://stream.supertv.gg:3001/supertv/sport/stv1/ch1/adaptive.m3u8'
  },
  {
    id: 'bein-sport-2',
    name: 'beIN Sports',
    logo: 'https://cdn.miswag.me/images/images/miswag_oUHT2K.jpg',
    categories: ['Sports'],
    streamUrl: '/api/proxy?url=https://stream.supertv.gg:3001/supertv/sport/stv1/ch2/adaptive.m3u8'
  },
  {
    id: 'bein-sport-3',
    name: 'beIN Sports 2',
    logo: 'https://cdn.miswag.me/images/images/miswag_oUHT2K.jpg',
    categories: ['Sports'],
    streamUrl: '/api/proxy?url=http://sewv654wfcsdwfi87fwvgbngh.siauliairsavlt.pw/iptv/PQRQCB2NKUWPMCFCEQXDT4Z3/6123/index.m3u8'
  },
  {
    id: 'alkass-one',
    name: 'Alkass One',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRNpGIj1QLP76Ib6v_ar4tojW4SpgZeuZFZgWZJDI7YfA&s=10',
    categories: ['Sports'],
    streamUrl: '/api/proxy?url=https://liveeu-gcp.alkassdigital.net/alkass2-p/main.m3u8'
  },
  {
    id: 'alkass-three',
    name: 'Alkass 3',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRNpGIj1QLP76Ib6v_ar4tojW4SpgZeuZFZgWZJDI7YfA&s=10',
    categories: ['Sports'],
    streamUrl: '/api/proxy?url=https://liveeu-gcp.alkassdigital.net/alkass3-p/main.m3u8'
  },
  {
    id: 'dubai-sports',
    name: 'Dubai Sports',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Dubai_Sports_logo_2011.png',
    categories: ['Arabic', 'Sports'],
    streamUrl: '/api/proxy?url=https://dmitv.mangomolo.com/dubaisports/smil:dubaisports.smil/playlist.m3u8'
  },
  {
    id: 'ufc',
    name: 'UFC',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRkcFL0mWry_f4Pe69U2d_9UqXxgzcKnLhU_Dkuc0a3Ww&s=10',
    categories: ['Sports'],
    streamUrl: '/api/proxy?url=https://linear-893.frequency.stream/dist/xumo/893/hls/master/playlist.m3u8'
  },
  {
    id: 'real-madrid',
    name: 'Real Madrid',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTe1eKn6VtzgT4WTqJp033bUjKmg0OgNPT7TjQjWNMCfQ&s=10',
    categories: ['Sports'],
    streamUrl: '/api/proxy?url=https://rmtv.akamaized.net/hls/live/2043153/rmtv-es-web/master.m3u8'
  },
  {
    id: 'barca',
    name: 'Barca TV',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHjoRjMZ29Mb3MgVtrcvhwGZNbOo2tf8CdSBm6gNKxrw&s=10',
    categories: ['Sports'],
    streamUrl: '/api/proxy?url=https://amg17560-fcb-amg17560c1-rakuten-uk-4891.playouts.now.amagi.tv/playlist/amg17560-fcbarcelona-topbarcaenglish-rakutenuk/playlist.m3u8'
  },
  {
    id: '4kurd',
    name: '4kurd',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRINg01KFkEMA67ZXsTtEa_5XEGX7-NfpuygWThOR-B6A&s=10',
    categories: ['Kurdish', 'General'],
    streamUrl: '/api/proxy?url=https://4kuhls.persiana.live/hls/stream.m3u8'
  },
  {
    id: 'banar-family',
    name: 'Banar Family',
    logo: 'https://i.imgur.com/4XKhH9F.png',
    categories: ['Kurdish', 'General'],
    streamUrl: '/api/proxy?url=https://cdn.karwan.tv/bnar-family/index.m3u8'
  },
  {
    id: 'barin-movies',
    name: 'Barin Movies',
    logo: 'https://i.imgur.com/bkJ5UwD_d.webp?maxwidth=760&fidelity=grand',
    categories: ['Kurdish', 'General'],
    streamUrl: '/api/proxy?url=https://cdn.karwan.tv/barin-movies/index.m3u8'
  },
  {
    id: 'bnar-movies',
    name: 'Bnar Movies',
    logo: 'https://i.imgur.com/66Fv1iQ.png',
    categories: ['Kurdish', 'General'],
    streamUrl: '/api/proxy?url=https://cdn.karwan.tv/bnar-movies/index.m3u8'
  },
  {
    id: 'barin-dom',
    name: 'Barin Dom',
    logo: 'https://i.imgur.com/ThN12xO.png',
    categories: ['Kurdish', 'General'],
    streamUrl: '/api/proxy?url=http://87.98.145.107:80/edge/streambarin-doc/chunks.m3u8'
  },
  {
    id: 'banar-action',
    name: 'Banar Action',
    logo: 'https://i.imgur.com/iQPySGB.png',
    categories: ['Kurdish', 'General'],
    streamUrl: '/api/proxy?url=https://cdn.karwan.tv/bnar-action/index.m3u8'
  },
  {
    id: 'barin-quran',
    name: 'Barin Quran',
    logo: 'https://i.imgur.com/8G11lXw.png',
    categories: ['Islamic'],
    streamUrl: '/api/proxy?url=http://baskhd.ddns.net:40/live/QURANHDTV/mono.m3u8'
  },
  {
    id: 'barin-family',
    name: 'Barin Family',
    logo: 'https://i.imgur.com/H0C79qX.png',
    categories: ['Kurdish', 'General'],
    streamUrl: '/api/proxy?url=http://baskhd.ddns.net:40/live/BarinfamilyHD/mono.m3u8'
  },
  {
    id: 'next-tv',
    name: 'Next TV',
    logo: 'https://i.postimg.cc/SXNd76jC/image.png',
    categories: ['Kurdish', 'General'],
    streamUrl: '/api/proxy?url=https://karwan.tv/next-tv/'
  },
  {
    id: 'zagros-tv',
    name: 'Zagros TV',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRlAIekGeai2lZCc95U1LXXEDlw04Xw0QPWKG3rD1ANFg&s=10',
    categories: ['Kurdish', 'General'],
    streamUrl: '/api/proxy?url=https://5a3ed7a72ed4b.streamlock.net/zagrostv/SMIL:myStream.smil/chunklist_w469474030_b1700000_sleng_t64MTA4MHA=.m3u8'
  },
  {
    id: 'khak-tv',
    name: 'Khak Tv',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQuTi0TarCvbDfQVuZdsYS2EYQcxGGSvOz3X-uos25ZzA&s',
    categories: ['Kurdish', 'General'],
    streamUrl: '/api/proxy?url=http://bblserver.ddns.net:1935/stream/khakhd/playlist.m3u8'
  }
];

const generateJirmendEpisodes = (): Episode[] => {
  const episodes: Episode[] = [
    { id: 'jirmend-ep1', number: 1, name: 'Episode 1 (خەلەکا ١)', streamUrl: 'https://ok.ru/video/15542393965207', duration: '24m', description: 'بڕیار و سەرکەفتنا دورانی سەبارەت شیکارکرنا مەتەلا بیرکارییێ یا ئێک ملیۆن دۆلاری.', image: 'https://i.postimg.cc/qtFRLWmg/image.png' },
    { id: 'jirmend-ep2', number: 2, name: 'Episode 2 (خەلەکا ٢)', streamUrl: 'https://ok.ru/video/15551506090647', duration: '25m', description: 'بابێ دورانی (ئیسکەندەر) هەولددەت نێزیک ببیت بۆ تەڵەکەبۆکرنا بهورە و شیانێن وی.', image: 'https://i.postimg.cc/xXT1S9h2/image.png' },
    { id: 'jirmend-ep3', number: 3, name: 'Episode 3 (خەلەکا ٣)', streamUrl: 'https://ok.ru/video/15575557278359', duration: '26m', description: 'دوران بڕیارێ ددەت کو شیانێن خۆ دژی پلانێن بابێ خۆ بکاربینیت و ڕووبەڕووی وی ببیت.', image: 'https://i.postimg.cc/gxk2PGQk/image.png' },
    { id: 'jirmend-ep4', number: 4, name: 'Episode 4 (خەلەکا ٤)', streamUrl: 'https://ok.ru/video/15575687826071', duration: '22m', description: 'پەیوەندیێن خێزانی یێن ئالۆز پتر تێکدچن دەمێ ئیسکەندەر پلانەکا نوی دادەنیت.', image: 'https://i.postimg.cc/yDY8z7tB/image.png' },
    { id: 'jirmend-ep5', number: 5, name: 'Episode 5 (خەلەکا ٥)', streamUrl: 'https://ok.ru/video/15575830301335', duration: '25m', description: 'دوران مەتەلەکا نوی یا ئالۆز شیکار دکەت کو کارتێکرنێ ل سەر پاشەڕۆژا وی دکەت.', image: 'https://i.postimg.cc/jDdSrRmS/image.png' }
  ];

  const descriptions = [
    'دوران بڕیارێ ددەت کو شیانێن خۆ دژی پلانێن بابێ خۆ بکاربینیت و ڕووبەڕووی وی ببیت.',
    'پەیوەندیێن خێزانی یێن ئالۆز پتر تێکدچن دەمێ ئیسکەندەر پلانەکا نوی دادەنیت.',
    'دوران مەتەلەکا نوی یا ئالۆز شیکار دکەت کو کارتێکرنێ ل سەر پاشەڕۆژا وی دکەت.',
    'هێزێن دژبەر هەولددەن نێزیکی دوران ببن بۆ ب دەستڤەئینانا بەهرەیا وی.',
    'کێشەیێن خێزانی ل دۆر دوران سەر هەڵددەنەڤە و گۆشارەکا مەزن ل سەر دروست دبیت.',
    'دوران ڕووبەڕووی بڕیارەکا چارەنڤیسساز دبیت کو ژیانا هەڤالێن وی دگهۆڕیت.',
    'ئیسکەندەر ب هاریکاریا هەڤپشکێن خۆ هەولا دانانا پیلانێن نوی ددەت بەرامبەر دوران.',
    'هێژ هەڤالێن نێزیک یێن دوران هەولددەن وی ژ مەترسیێن پیلانێن بابێ وی بپارێزن.',
    'ڕووبەڕووبوونەوەیەکا بهێز د ناڤبەرا دوران و بابێ خۆ دا ل سەر دەسهەلاتێ ڕووددەت.',
    'بەهرەیا بلیمەتیا بیرکارییێ دهێتە بکارئینان بۆ دیتنا چارەسەریێن ئاڵۆز د کاتەکێ کورت دا.',
    'پلانێن ژێر تاق تێنە دیارکرن و گۆڕانکاریێن مەزن د ڕەوتێ درامایێ دا چێدبن.',
    'ڕووبەڕووبوونەوە دگەل پلانێن نوی یێن ئیسکەندەری و بەردەوامیا کێبرکێیا دوران ب هێز دبن.'
  ];

  const toKurdishNumerals = (num: number): string => {
    const kurdishDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return num
      .toString()
      .split('')
      .map(char => {
        const digit = parseInt(char, 10);
        return isNaN(digit) ? char : kurdishDigits[digit];
      })
      .join('');
  };

  const today = new Date();
  today.setHours(20, 0, 0, 0); // Release starting today at 8:00 PM (20:00)
  const baseTime = today.getTime();

  for (let i = 6; i <= 114; i++) {
    const descIndex = (i - 6) % descriptions.length;
    // Each scheduled episode is released exactly 1 day (24 hours) after the previous one
    const releaseTime = baseTime + (i - 6) * 24 * 60 * 60 * 1000;
    episodes.push({
      id: `jirmend-ep${i}`,
      number: i,
      name: `Episode ${i} (خەلەکا ${toKurdishNumerals(i)})`,
      streamUrl: '',
      duration: `${22 + (i % 7)}m`,
      description: descriptions[descIndex],
      releaseTime
    });
  }

  return episodes;
};

export const MOVIES: Channel[] = [
  {
    id: 'drama-jirmend',
    name: 'ژیڕمەند',
    logo: 'https://i.postimg.cc/NKJ41vSq/image.png',
    banner: 'https://i.postimg.cc/NKJ41vSq/image.png',
    categories: ['Kurdish', 'Drama', 'Badini'],
    streamUrl: 'https://ok.ru/video/15542393965207',
    isMovie: true,
    year: '2024',
    rating: '9.1/10',
    duration: '114 Episodes',
    description: 'درامایا ژیڕمەند (Deha) چیرۆکا دورانی ڤەدگێڕیت، گەنجەکێ زیرەک و بلیمەتێ بیرکارییێ کۆ دکاریت مەتەلەکا مەزنا بیرکارییێ شیکار بکەت، لێ ڕووبەڕووی پلان و پیلانێن بابێ خۆ (ئیسکەندەر) دبیت. (درامایا ژیڕمەند دۆبلاژکری ب زمانێ کوردی بادینی)',
    episodes: generateJirmendEpisodes()
  }
];
