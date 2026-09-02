const base = 'http://localhost:3001'

// 列表第一条
const listRes = await fetch(base + '/hotstation/events?page=1&pageSize=2').then(r => r.json())
console.log('== 列表 ==', 'total:', listRes.data.total)
const ev = listRes.data.list[0]
console.log('id:', ev.id, '| title:', ev.title)
console.log('keys:', Object.keys(ev).join(', '))
console.log('summary:', (ev.summary || '').slice(0, 100))
console.log('content:', (ev.content || '').slice(0, 100))
console.log('timeline:', (ev.timeline || []).length, '| opinions:', (ev.opinions || []).length, '| emotions:', (ev.emotions || []).length, '| radar:', !!ev.radar)

// 详情接口
const detailRes = await fetch(base + '/hotstation/events/' + ev.id).then(r => r.json())
console.log('\n== 详情 ==', 'code:', detailRes.code)
const d = detailRes.data
console.log('keys:', Object.keys(d || {}).join(', '))
if (d) {
  console.log('timeline:', (d.timeline || []).length, '| opinions:', (d.opinions || []).length, '| emotions:', (d.emotions || []).length, '| radar:', !!d.radar, '| whitepaper:', !!d.whitepaper)
  console.log('content:', (d.content || '').slice(0, 100))
}
