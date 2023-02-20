import _unit from './UnitMath.js'

const unit = _unit.config({ precision: 8 })

const model = {
  operand1: null,
  operand2: document.getElementById('operand2').value,
  operator: null,
  lastExpression: null,
  hasError: false,
}

const infixOperatorMap = {
  add: '+',
  sub: '-',
  mul: '*',
  div: '/',
  pow: '^',
  to: 'to',
}

// Add event listeners if the infix operators are clicked
const infixOperators = ['add', 'sub', 'mul', 'div', 'pow', 'to']
infixOperators.forEach((op) => {
  document.getElementById(op).addEventListener('click', () => {
    if (model.operator === null && model.operand2 !== '') {
      setOperator(op)
    }
    document.getElementById('operand2').focus()
  })
})

// Update model when the input changes
document.getElementById('operand2').addEventListener('input', (event) => {

  // Don't update the model if there's an error
  if (model.hasError) return

  model.operand2 = event.target.value

  model.lastExpression = null

  // If the user typed an infix operator, remove that operator from the input and call setOperator
  if (model.operand2.endsWith('+ ')) {
    model.operand2 = model.operand2.slice(0, -2)
    setOperator('add')
  }
  if (model.operand2.endsWith('- ')) {
    model.operand2 = model.operand2.slice(0, -2)
    setOperator('sub')
  }
  if (model.operand2.endsWith('* ')) {
    model.operand2 = model.operand2.slice(0, -2)
    setOperator('mul')
  }
  if (model.operand2.endsWith('/ ')) {
    model.operand2 = model.operand2.slice(0, -2)
    setOperator('div')
  }
  if (model.operand2.endsWith('^ ')) {
    model.operand2 = model.operand2.slice(0, -2)
    setOperator('pow')
  }
  if (model.operand2.endsWith(' to ')) {
    model.operand2 = model.operand2.slice(0, -4)
    setOperator('to')
  }
  render()
})

// Clear the model when the clear button is clicked
document.getElementById('clear').addEventListener('click', () => {
  clearModel()
})

// Perform the calculation when the equals button is clicked
document.getElementById('equals').addEventListener('click', () => {
  performCalculation()
})

document.getElementById('operand2').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    // Perform the calculation when the enter key is pressed
    performCalculation()
  }
  else if (event.key === 'Escape') {
    // Clear the model when the escape key is pressed
    clearModel()
  }
})

function clearModel() {
  model.operand1 = null
  model.operand2 = ''
  model.operator = null
  model.lastExpression = null
  model.hasError = false
  render()
  document.getElementById('operand2').focus()
}

function performCalculation() {
  if (model.hasError) return

  if (model.operator !== null) {
    model.lastExpression = model.operand1 + ' ' + infixOperatorMap[model.operator] + ' ' + model.operand2
    try {
      model.operand2 = unit(model.operand1)[model.operator](model.operand2).simplify().toString()
    } catch (ex) {
      model.operand2 = ex.message
      model.hasError = true
    }
    model.operand1 = null
    model.operator = null
    render()
    document.getElementById('operand2').focus()
  }
}

function setOperator(op) {
  if (model.operand1 === null) {
    model.operator = op
    model.operand1 = model.operand2
    model.operand2 = ''
    render()
  }
}

function render() {
  if (model.operand1) {
    document.getElementById('operand1').innerText = unit(model.operand1).toString()
    document.getElementById('operand1').style.display = 'inline'
  } else {
    document.getElementById('operand1').style.display = 'none'
  }

  if (model.operator) {
    document.getElementById('operator').innerText = infixOperatorMap[model.operator] ?? ''
    document.getElementById('operator').style.display = 'inline'
  } else {
    document.getElementById('operator').style.display = 'none'
  }

  if (model.lastExpression) {
    document.getElementById('lastExpression').innerText = model.lastExpression
    document.getElementById('lastExpression').style.display = 'inline'
  } else {
    document.getElementById('lastExpression').style.display = 'none'
  }

  document.getElementById('operand2').value = model.operand2
  console.log(model)
}

render()

document.getElementById('operand2').focus()
