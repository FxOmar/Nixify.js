import { createApp as vCreateApp, ref } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'

const qp=new URLSearchParams(location.search)
const n=Number(qp.get('n'))||1000
const k=Number(qp.get('k'))||1000

function makeData(cnt){const a=[];for(let i=0;i<cnt;i++)a.push({id:i,label:'Item '+i});return a}

const app=vCreateApp({
  setup(){
    const items=ref([])
    const runCount=ref(0)
    function mountData(){items.value=makeData(n)}
    async function update(){
      performance.mark('update:start')
      for(let i=0;i<k;i++){
        const idx=(i*13)%n
        const next=items.value.slice()
        next[idx]={...next[idx],label:'Item '+idx+'*'+i}
        items.value=next
      }
      runCount.value++
      await new Promise(r=>requestAnimationFrame(()=>r()))
      performance.mark('update:end')
      performance.measure('vue:update','update:start','update:end')
    }
    return{items,runCount,mountData,update}
  },
  template:`
    <div>
      <p>{{ runCount }}</p>
      <div>
        <p v-for="item in items" :key="item.id">{{ item.label }}</p>
      </div>
    </div>
  `
})

performance.mark('mount:start')
app.mount('#app')
performance.mark('mount:end')
performance.measure('vue:mount','mount:start','mount:end')

async function fps(d=2000){let frames=0;const end=performance.now()+d;return new Promise(r=>{function tick(){frames++;if(performance.now()<end){requestAnimationFrame(tick)}else r(frames*1000/d)}requestAnimationFrame(tick)})}

async function runBench(){
  const ctx=app._instance.ctx
  ctx.mountData()
  await ctx.update()
  const f=await fps()
  const measures=performance.getEntriesByType('measure')
  const out=document.getElementById('out')
  out.textContent=JSON.stringify(measures.map(m=>({name:m.name,ms:+m.duration.toFixed(2)})).concat([{name:'vue:fps',ms:+f.toFixed(1)}]),null,2)
}

runBench()