function getEmployeeFlex(store) {
  const employees = {
    '松竹店': ['琴', '菲菲', 'Johnny', 'keke', 'Wendy', 'tom', 'Dora', 'Sandy', 'umi'],
    '南興店': ['Elma', 'Bella', 'Abby', '珮茹'],
    '漢口店': ['麗君', '巧巧', 'cherry', 'Judy', 'Celine', '采妍'],
    '太平店': ['小麥', 'Erin', '小安', '雯怡', 'yuki'],
    '高雄店': ['mimi', 'jimmy'],
    '松安店': ['lina', 'shu']
  };
  const names = employees[store] || [];

  return {
    type: 'flex',
    altText: `請選擇 ${store} 員工`,
    contents: {
      type: 'carousel',
      contents: names.map((name) => ({
        type: 'bubble',
        size: 'micro',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: name,
              size: 'sm',
              weight: 'bold'
            }
          ]
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'button',
              style: 'primary',
              height: 'sm',
              action: {
                type: 'message',
                label: '選擇',
                text: name
              }
            }
          ]
        }
      }))
    }
  };
}
