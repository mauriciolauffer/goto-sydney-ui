describe('masterDetail', function () {
  it('Should load the app', () => {
    expect(browser.getTitle()).toBe('goto.Sydney Public Transport');
  });

  /*it('Should display the master screen', () => {
    element(by.control({
      viewName: 'mlauffer.goto.sydney.australia.view.Master',
      controlType: 'sap.m.ObjectListItem',
      properties: {
        title: itemTitle
      }}))
      .click();
    /*const itemTitle = 'F2 Taronga Zoo';
    const listItem = element(by.control({
      viewName: 'mlauffer.goto.sydney.australia.view.Master',
      controlType: 'sap.m.ObjectListItem',
      properties: {
        title: itemTitle
      }}));
    expect(listItem).asControl().getProperty('title').toBe(itemTitle);
    //listItem.click();
  });

  it('Should display the detail screen', () => {
    expect(element.all(by.control({
      viewName: 'mlauffer.goto.sydney.australia.view.Map',
      controlType:'sap.m.HBox'}))
      .count()).toBe(1);
  });*/
});
