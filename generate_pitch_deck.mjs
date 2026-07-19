import PptxGenJS from 'pptxgenjs';

const pptx = new PptxGenJS();

pptx.layout = 'LAYOUT_16x9';

// Define master slides / branding
pptx.defineSlideMaster({
  title: 'MASTER_SLIDE',
  background: { color: 'F7F7F7' },
  objects: [
    { rect: { x: 0, y: 0, w: '100%', h: 0.5, fill: { color: '00D4A4' } } },
    { text: { text: 'LeadAIStudio AIOps', options: { x: 0.5, y: 0.1, w: 3, h: 0.3, fontFace: 'Arial', color: '00926F', fontSize: 12, bold: true } } },
    { text: { text: 'Enterprise Command Center', options: { x: 9.0, y: 7.1, w: 3.5, h: 0.3, fontFace: 'Arial', color: '6B6B6D', fontSize: 10, align: 'right' } } }
  ]
});

pptx.defineSlideMaster({
  title: 'TITLE_SLIDE',
  background: { color: '0A0A0A' },
  objects: [
    { rect: { x: 0, y: 0, w: '100%', h: 0.5, fill: { color: '00D4A4' } } },
    { text: { text: 'LeadAIStudio AIOps', options: { x: '50%', y: 0.1, w: 3, h: 0.3, fontFace: 'Arial', color: 'FFFFFF', fontSize: 12, bold: true, align: 'center' } } },
  ]
});

// SLIDE 1: Title
let slide = pptx.addSlide({ masterName: 'TITLE_SLIDE' });
slide.addText('LeadAIStudio AIOps', { x: 1, y: 2.5, w: 8, h: 1, fontSize: 48, bold: true, color: 'FFFFFF', fontFace: 'Arial' });
slide.addText('The DEX-First IT Operations Platform', { x: 1, y: 3.5, w: 8, h: 1, fontSize: 24, color: '00D4A4', fontFace: 'Arial' });
slide.addText('Replacing the tangle of disconnected IT tools with one intelligent system of record.', { x: 1, y: 4.5, w: 8, h: 1, fontSize: 16, color: 'A8A8AA', fontFace: 'Arial' });

// SLIDE 2: The Problem
slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
slide.addText('The Problem: Reactive IT Operations', { x: 0.5, y: 0.8, w: 9, h: 0.8, fontSize: 32, bold: true, color: '0A0A0A' });
slide.addText([
    { text: 'Traditional ITSM waits for users to complain.', options: { bullet: true } },
    { text: 'IT teams are blind to actual endpoint health until a ticket is filed.', options: { bullet: true } },
    { text: 'Siled tools (Ticketing, Asset Mgmt, MDM) create workflow friction.', options: { bullet: true } },
    { text: 'Employees experience high friction with clunky self-service portals.', options: { bullet: true } }
], { x: 0.5, y: 2.0, w: 8, h: 3, fontSize: 20, color: '3A3A3C', fontFace: 'Arial', lineSpacing: 35 });

// SLIDE 3: The Solution
slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
slide.addText('The Solution: Proactive, DEX-First IT', { x: 0.5, y: 0.8, w: 9, h: 0.8, fontSize: 32, bold: true, color: '0A0A0A' });
slide.addText('Unifying Endpoint Telemetry and Service Desk Workflows in a single system.', { x: 0.5, y: 1.8, w: 9, h: 0.5, fontSize: 20, color: '00926F', italic: true });
slide.addText([
    { text: 'Real-Time Telemetry:', options: { bold: true, bullet: true } },
    { text: ' Continuous monitoring of hardware, app crashes, and security posture.' },
    { text: '\nProactive Remediation:', options: { bold: true, bullet: true } },
    { text: ' Fix issues remotely in bulk, often before the user submits a ticket.' },
    { text: '\nFrictionless Self-Service:', options: { bold: true, bullet: true } },
    { text: ' A clean, module-scoped portal for employees to request catalog items and view KB articles.' }
], { x: 0.5, y: 2.5, w: 9, h: 4, fontSize: 18, color: '3A3A3C', fontFace: 'Arial' });

// SLIDE 4: Key Capabilities & Architecture
slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
slide.addText('Key Capabilities', { x: 0.5, y: 0.8, w: 9, h: 0.8, fontSize: 32, bold: true, color: '0A0A0A' });
slide.addTable([
    [{ text: 'Agent Telemetry', options: { bold: true, fill: '00D4A4', color: 'FFFFFF' } }, { text: 'Automated Campaigns', options: { bold: true, fill: '00D4A4', color: 'FFFFFF' } }],
    ['Monitors CPU, Memory, Disk Health, Battery, Latency, and Crashes in real-time across Windows and Linux.', 'Run bulk PowerShell/Bash remediations across 1,000+ endpoints with a single click.'],
    [{ text: 'SLA & Incident Management', options: { bold: true, fill: '00D4A4', color: 'FFFFFF' } }, { text: 'Role-Based Access Control', options: { bold: true, fill: '00D4A4', color: 'FFFFFF' } }],
    ['DEX signals, SLA clocks, and breach warnings natively integrated into the ticket queue.', 'Granular permissions streamline the UI: IT sees ops depth, employees see only self-service.']
], { x: 0.5, y: 2.0, w: 9, fill: 'FFFFFF', color: '3A3A3C', fontSize: 16, border: { type: 'solid', color: 'E5E5E5', pt: 1 } });

// SLIDE 5: Use Cases & ROI
slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
slide.addText('Value Proposition & ROI', { x: 0.5, y: 0.8, w: 9, h: 0.8, fontSize: 32, bold: true, color: '0A0A0A' });
slide.addText([
    { text: 'Zero-Ticket IT: ', options: { bold: true, color: '00926F', bullet: true } },
    { text: 'Resolve up to 40% of endpoint issues before employees even know there is a problem.' },
    { text: '\n\nDrastic MTTR Reduction: ', options: { bold: true, color: '00926F', bullet: true } },
    { text: 'No more "can you send me your logs?". The agent provides exact crash logs, latency, and hardware health instantly.' },
    { text: '\n\nLower Training Costs: ', options: { bold: true, color: '00926F', bullet: true } },
    { text: 'A single, unified "Mission Control" interface means IT agents don\'t have to learn 5 different platforms.' }
], { x: 0.5, y: 2.0, w: 9, h: 4, fontSize: 20, color: '3A3A3C', fontFace: 'Arial' });

// SLIDE 6: The AI Roadmap (Next-Gen)
slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
slide.addText('The Next-Gen Roadmap', { x: 0.5, y: 0.8, w: 9, h: 0.8, fontSize: 32, bold: true, color: '0A0A0A' });
slide.addText([
    { text: 'Shadow IT Cost-Killer:', options: { bold: true, bullet: true } },
    { text: ' Identify unused paid SaaS licenses and automatically revoke them (ROI in 60 days).' },
    { text: '\nHardware Arbitrage:', options: { bold: true, bullet: true } },
    { text: ' AI predicts the exact mathematical moment to sell laptops on the refurbished market before failure.' },
    { text: '\nPredictive Burnout Engine:', options: { bold: true, bullet: true } },
    { text: ' Flag employees at risk of quitting by correlating high hardware stress with ticket sentiment.' },
    { text: '\n"Digital Twin" IT Agent:', options: { bold: true, bullet: true } },
    { text: ' Vector DB clones your best senior IT agent\'s diagnostic logic to auto-triage tickets.' }
], { x: 0.5, y: 1.8, w: 9, h: 5, fontSize: 16, color: '3A3A3C', fontFace: 'Arial', lineSpacing: 22 });

// SLIDE 7: Conclusion
slide = pptx.addSlide({ masterName: 'TITLE_SLIDE' });
slide.addText('Ready to elevate your IT Operations?', { x: 1, y: 3.0, w: 8, h: 1, fontSize: 36, bold: true, color: 'FFFFFF', align: 'center', fontFace: 'Arial' });
slide.addText('LeadAIStudio AIOps', { x: 1, y: 4.5, w: 8, h: 1, fontSize: 20, color: '00D4A4', align: 'center', fontFace: 'Arial' });

pptx.writeFile({ fileName: 'LeadAIStudio_Pitch_Deck.pptx' })
  .then(fileName => {
      console.log(`Successfully created ${fileName}`);
  })
  .catch(err => {
      console.error(err);
  });
